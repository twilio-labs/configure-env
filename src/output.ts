import { ParseResult } from './parser';

export function createOutput(
  parsedExample: ParseResult,
  answers: { [x: string]: string }
) {
  let output = parsedExample.outputTemplate;
  for (let variableToSet of parsedExample.variables) {
    let value: string = (
      answers[variableToSet.key] ||
      variableToSet.default ||
      ''
    ).toString();
    if (value) {
      value = `"${value.replace(/"/, '"')}"`;
    } else {
      value = '';
    }
    output = output.replace(`{{${variableToSet.key}}}`, value);
  }
  return output;
}
