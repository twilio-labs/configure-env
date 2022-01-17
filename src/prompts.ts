import prompts, { Answers, Choice, PromptObject, PromptType } from 'prompts';
import { WriteStream } from 'tty';
import { extractEnumFormat, ParseResult, VariableFormat } from './parser';
import { getValidator } from './validators';

export function getPromptType(format: VariableFormat): PromptType {
  if(format.startsWith('enum(')){
    return 'select';
  }
  switch (format) {
    case 'secret':
      return 'invisible';
    case 'integer':
    case 'number':
      return 'number';
    default:
      return 'text';
  }
}
     
export function getChoices(format: VariableFormat): Choice[] | undefined {
  if(format.startsWith('enum(')){
    const enumValues = extractEnumFormat(format);
    return enumValues.split(',').map(possibleValue => ({
      title: possibleValue,
      value: possibleValue
    }))
  }
}
   
export function getInitial(format: VariableFormat, initialValue: string | null): any {
  if(format.startsWith('enum(')){
    const enumValues = extractEnumFormat(format);
    const values =  enumValues.split(',');
    for(let [index, value] of values.entries()) {
      if(value === initialValue) {
        return index;
      }
    }
  }
  return initialValue;
}

export function createQuestions(
  parsedExample: ParseResult,
  promptStream: WriteStream
): PromptObject[] {
  return parsedExample.variables
    .filter(entry => entry.configurable)
    .map(entry => {
      return {
        type: getPromptType(entry.format),
        name: entry.key,
        message: entry.description || `Please enter a value for ${entry.key}`,
        initial: getInitial(entry.format, entry.default),
        validate: getValidator(entry.format),
        stdout: promptStream,
        float: entry.format === 'number' ? true : undefined,
        choices: getChoices(entry.format),
      };
    });
}

export function handleCancel(prompt: PromptObject, answers: Answers<string>) {
  /* keep asking questions */
  return true;
}

export async function promptForVariables(
  parsedExample: ParseResult,
  promptStream: WriteStream
) {
  const questions = createQuestions(parsedExample, promptStream);
  const answers = await prompts(questions, { onCancel: handleCancel });
  return answers;
}
