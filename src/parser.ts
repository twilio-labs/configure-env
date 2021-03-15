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

export const VALID_FILE_FORMATS = ['json'] as const;

export type BaseVariableFormat = typeof VALID_BASE_FORMATS[number];
export type ListFormat = string;
export type MapFormat = string;
export type FileFormat = string;
export type VariableFormat =
  | BaseVariableFormat
  | ListFormat
  | MapFormat
  | FileFormat;

export type VariableDeclaration = {
  key: string;
  required: boolean;
  format: VariableFormat;
  description: string | null;
  link: string | null;
  default: string | null;
  configurable: boolean;
  hasExplicitDescription?: boolean;
  hasAnyComment?: boolean;
  credentialKey: string | null;
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
  credentialKey: null,
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
 * Extracts the formats wrapped in `map()` or throws an error if one is an invalid format
 * @param format a format string wrapped with `map()`
 */
export function extractMapFormats(
  format: string
): [BaseVariableFormat, BaseVariableFormat] {
  let listValues = removePrefix('map(', format);
  listValues = listValues.substr(0, listValues.length - 1).trim();
  const [keyFormat, valueFormat] = listValues.split(',').map(trim);
  if (validFormats.includes(keyFormat) && validFormats.includes(valueFormat)) {
    return [keyFormat as BaseVariableFormat, valueFormat as BaseVariableFormat];
  } else {
    throw new Error(
      `Invalid map format value. Received "${keyFormat}" for key and "${valueFormat}" for value`
    );
  }
}

const validFileFormats: string[] = [...VALID_FILE_FORMATS];

/**
 * Extracts the format wrapped in `file()` or throws an error if it's an invalid format
 * @param format a format string wrapped with `file()`
 */
export function extractFileFormat(format: string): BaseVariableFormat {
  let fileValue = removePrefix('file(', format);
  fileValue = fileValue.substr(0, fileValue.length - 1).trim();
  if (validFileFormats.includes(fileValue)) {
    return fileValue as BaseVariableFormat;
  } else {
    throw new Error(`Invalid file format value. Received "${fileValue}"`);
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
    const listValueFormat = extractListFormat(sanitizedText);
    return `list(${listValueFormat})`;
  } else if (sanitizedText.startsWith('map(') && sanitizedText.endsWith(')')) {
    // map format
    const [keyFormat, valueFormat] = extractMapFormats(sanitizedText);
    return `map(${keyFormat},${valueFormat})`;
  } else if (sanitizedText.startsWith('file(') && sanitizedText.endsWith(')')) {
    // file format
    const fileValueFormat = extractFileFormat(sanitizedText);
    return `file(${fileValueFormat})`;
  }

  throw new Error(`Invalid format. Received: "${text}"`);
}

/**
 * Removes a specified prefix from the beginning of a string and trims whitespace
 * @param prefix text to be removed
 * @param line text to remove the prefix from
 */
export function removePrefix(prefix: string, line: string): string {
  if (!line.startsWith(prefix)) {
    return line;
  }
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
  } else if (line.startsWith('credentialKey:')) {
    const val = trim(removePrefix('credentialKey:', line));
    addedInfo.credentialKey = val;
  } else {
    if (!currentDeclaration.hasExplicitDescription) {
      addedInfo.description = currentDeclaration.description
        ? `${currentDeclaration.description}\n${line}`
        : line;
    }
  }

  return { ...currentDeclaration, ...addedInfo, hasAnyComment: true };
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
  if (line.length === 0 || !line.includes('=')) {
    return currentDeclaration;
  }

  let [key, value] = line.split('=').map(trim);

  if (key.match(INVALID_DECLARATION_CHARACTERS)) {
    throw new Error(
      `Key of variable declaration can only contain the following characters. Received: "${key}"`
    );
  }

  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.substr(1, value.length - 2);
    value.replace(/\\"/g, '"');
  } else if (value.startsWith(`'`) && value.endsWith(`'`)) {
    value = value.substr(1, value.length - 2);
    value.replace(/\\'/g, `'`);
  }

  const defaultValue = value.length === 0 ? currentDeclaration.default : value;
  const configurable = !currentDeclaration.hasAnyComment
    ? false
    : currentDeclaration.configurable;

  return { ...currentDeclaration, key, default: defaultValue, configurable };
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
      delete fullVariableData.hasAnyComment;
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
