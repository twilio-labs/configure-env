import prompts, { Answers, PromptObject, PromptType } from 'prompts';
import { WriteStream } from 'tty';
import { ParseResult, VariableFormat } from './parser';

export function getPromptType(format: VariableFormat): PromptType {
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

export function createQuestions(
  parsedExample: ParseResult,
  promptStream: WriteStream
): PromptObject[] {
  return parsedExample.variables.map(entry => {
    return {
      type: 'text',
      name: entry.key,
      message: entry.description || `Please enter a value for ${entry.key}`,
      initial: entry.default || undefined,
      stdout: promptStream,
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
