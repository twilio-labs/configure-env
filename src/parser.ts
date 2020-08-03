import fs from 'fs';
import os from 'os';

export const VALID_BASE_FORMATS = [
  'text',
  'phone_number',
  'email',
  'url',
  'sid',
  'integer',
  'number',
  'secret',
] as const;

export type BaseVariableFormat = typeof VALID_BASE_FORMATS[number];
export type ListFormat = string;
export type NestedListFormat = string;
export type VariableFormat = BaseVariableFormat | ListFormat | NestedListFormat;

export type VariableDeclaration = {
  key: string;
  required: boolean;
  format: VariableFormat;
  description: string | null;
  link: string | null;
  default: string | null;
  configurable: boolean;
  hasExplicitDescription?: boolean;
};

export type ParseResult = {
  variables: VariableDeclaration[];
  outputTemplate: string;
};

export const DEFAULT_ENTRY: VariableDeclaration = {
  key: '<EMPTY>',
  required: true,
  format: 'text',
  description: null,
  link: null,
  default: null,
  configurable: true,
};

const INVALID_DECLARATION_CHARACTERS = /[^a-zA-Z1-9_]/i;

/**
 * Trims whitespace of a string
 * @param text any string
 */
function trim(text: string): string {
  return text.trim();
}

/**
 * Splits the file into lines and trims whitespace of every line
 * @param envFileContent file content as string
 */
export function envFileToLines(envFileContent: string): string[] {
  return envFileContent.split('\n').map(trim);
}

/**
 * Converts a string representation of a boolean into a boolean. Throws an error for any other value
 * @param text string representing "true" or "false"
 */
export function textToBoolean(text: string): boolean {
  const sanitizedText = text.trim().toLowerCase();
  if (sanitizedText === 'true') {
    return true;
  } else if (sanitizedText === 'false') {
    return false;
  }

  throw new Error(
    `Valid values can only be true or false. Received: "${text}"`
  );
}

const validFormats: string[] = [...VALID_BASE_FORMATS];

/**
 * Extracts the format wrapped in `list()` or throws an error if it's an invalid format
 * @param format a format string wrapped with `list()`
 */
export function extractListFormat(format: string): BaseVariableFormat {
  let listValue = removePrefix('list(', format);
  listValue = listValue.substr(0, listValue.length - 1).trim();
  if (validFormats.includes(listValue)) {
    return listValue as BaseVariableFormat;
  } else {
    throw new Error(`Invalid list format value. Received "${listValue}"`);
  }
}

/**
 * Extracts the formats wrapped in `nested_list()` or throws an error if one is an invalid format
 * @param format a format string wrapped with `nested_list()`
 */
export function extractNestedListFormats(
  format: string
): [BaseVariableFormat, BaseVariableFormat] {
  let listValues = removePrefix('nested_list(', format);
  listValues = listValues.substr(0, listValues.length - 1).trim();
  const [listValueX, listValueY] = listValues.split(',').map(trim);
  if (validFormats.includes(listValueX) && validFormats.includes(listValueY)) {
    return [listValueX as BaseVariableFormat, listValueY as BaseVariableFormat];
  } else {
    throw new Error(
      `Invalid nested list format value. Received "${listValueX}" and "${listValueY}"`
    );
  }
}

/**
 * Parses string to check if it's a valid format. If it isn't it will throw an error. Otherwise it will return a sanitized version
 * @param text string to validate as format
 */
export function textToFormat(text: string): VariableFormat {
  const sanitizedText = text.trim().toLowerCase();
  if (validFormats.includes(sanitizedText)) {
    // regular base format
    return sanitizedText;
  } else if (sanitizedText.startsWith('list(') && sanitizedText.endsWith(')')) {
    // list format
    const listValue = extractListFormat(sanitizedText);
    return `list(${listValue})`;
  } else if (
    sanitizedText.startsWith('nested_list(') &&
    sanitizedText.endsWith(')')
  ) {
    // nested list format
    const [listValueX, listValueY] = extractNestedListFormats(sanitizedText);
    return `nested_list(${listValueX},${listValueY})`;
  }

  throw new Error(`Invalid format. Received: "${text}"`);
}

/**
 * Removes a specified prefix from the beginning of a string and trims whitespace
 * @param prefix text to be removed
 * @param line text to remove the prefix from
 */
export function removePrefix(prefix: string, line: string): string {
  return line.substr(prefix.length).trim();
}

/**
 * Parses comment line to look for special keyword comments and returns the parsed
 * result combined with the current variable declaration.
 * @param currentDeclaration the variable declaration so far (could be default)
 * @param line comment line to parse
 */
export function parseCommentLine(
  currentDeclaration: VariableDeclaration,
  line: string
): VariableDeclaration {
  // drop comment #
  line = line
    .trim()
    .substr(1)
    .trim();

  const addedInfo: Partial<VariableDeclaration> = {};
  if (line.startsWith('required:')) {
    const val = textToBoolean(removePrefix('required:', line));
    addedInfo.required = val;
  } else if (line.startsWith('format:')) {
    const val = textToFormat(removePrefix('format:', line));
    addedInfo.format = val;
  } else if (line.startsWith('description:')) {
    const val = trim(removePrefix('description:', line));
    addedInfo.description = val;
  } else if (line.startsWith('link:')) {
    const val = trim(removePrefix('link:', line));
    addedInfo.link = val;
  } else if (line.startsWith('default:')) {
    const val = trim(removePrefix('default:', line));
    addedInfo.default = val;
    addedInfo.hasExplicitDescription = true;
  } else if (line.startsWith('configurable:')) {
    const val = textToBoolean(removePrefix('configurable:', line));
    addedInfo.configurable = val;
  } else {
    if (!currentDeclaration.hasExplicitDescription) {
      addedInfo.description = currentDeclaration.description
        ? `${currentDeclaration.description} - ${line}`
        : line;
    }
  }

  return { ...currentDeclaration, ...addedInfo };
}

/**
 * Parses a variable declaration line and merges the key and default value with the
 * current variable declaration meta info. Throws an error for invalid keys
 * @param currentDeclaration the variable declaration parsed so far
 * @param line the variable declaration line to parse
 */
export function parseVariableDeclarationLine(
  currentDeclaration: VariableDeclaration,
  line: string
): VariableDeclaration {
  const [key, value] = line.split('=').map(trim);

  if (key.match(INVALID_DECLARATION_CHARACTERS)) {
    throw new Error(
      `Key of variable declaration can only contain the following characters. Received: "${key}"`
    );
  }
  const defaultValue = value.length === 0 ? currentDeclaration.default : value;

  return { ...currentDeclaration, key, default: defaultValue };
}

/**
 * Parses a .env file and extracts meta information according to the
 * [schema specified in the docs](../docs/SCHEMA.md). Returns the parsed
 * variable information and a mustache-style template to fill in data.
 *
 * @param envFileContent .env in string representation
 */
export function parse(envFileContent: string): ParseResult {
  const variables: VariableDeclaration[] = [];
  const outputTemplateLines: string[] = [];

  const lines = envFileToLines(envFileContent);

  let currentVariable = DEFAULT_ENTRY;
  for (const line of lines) {
    if (line.startsWith('#')) {
      // line is a comment
      currentVariable = parseCommentLine(currentVariable, line);
    } else if (line.includes('=')) {
      // line is a variable declaration
      const fullVariableData = parseVariableDeclarationLine(
        currentVariable,
        line
      );
      delete fullVariableData.hasExplicitDescription;
      variables.push({ ...fullVariableData });
      outputTemplateLines.push(
        `${fullVariableData.key}={{${fullVariableData.key}}}`
      );
      currentVariable = DEFAULT_ENTRY;
      continue;
    } else {
      // line is an empty line. Reset info gathering
      currentVariable = DEFAULT_ENTRY;
    }
    outputTemplateLines.push(line);
  }

  const outputTemplate = outputTemplateLines.join(os.EOL);

  return { variables, outputTemplate };
}

export function parseFileSync(filePath: string | number | Buffer): ParseResult {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return parse(fileContent);
}

export async function parseFile(
  filePath: string | Buffer | URL
): Promise<ParseResult> {
  const fileContent = await fs.promises.readFile(filePath, 'utf8');
  return parse(fileContent);
}
