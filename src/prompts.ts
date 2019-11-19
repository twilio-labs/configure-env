import prompts, { Answers, PromptObject } from 'prompts';
import { WriteStream } from 'tty';
import { ParsedExample } from './exampleFileParser';

export function createQuestions(
  parsedExample: ParsedExample,
  promptStream: WriteStream
): PromptObject[] {
  return parsedExample.variablesToSet.map(entry => {
    return {
      type: 'text',
      name: entry.name,
      message: entry.comment,
      initial: entry.defaultValue,
      stdout: promptStream,
    };
  });
}

export function handleCancel(prompt: PromptObject, answers: Answers<string>) {
  /* keep asking questions */
  return true;
}

export async function promptForVariables(
  parsedExample: ParsedExample,
  promptStream: WriteStream
) {
  const questions = createQuestions(parsedExample, promptStream);
  const answers = await prompts(questions, { onCancel: handleCancel });
  return answers;
}
