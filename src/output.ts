import { ParsedExample } from './exampleFileParser';

export function createOutput(
  parsedExample: ParsedExample,
  answers: { [x: string]: string }
) {
  let output = parsedExample.outputTemplate;
  for (let variableToSet of parsedExample.variablesToSet) {
    let value: string = answers[variableToSet.name];
    if (value) {
      value = `"${value.replace(/"/, '"')}"`;
    } else {
      value = '';
    }
    output = output.replace(`{{${variableToSet.name}}}`, value);
  }
  return output;
}
