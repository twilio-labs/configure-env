export type ParsedExample = {
  variablesToSet: Array<{
    name: string;
    comment: string;
    defaultValue: string | undefined;
  }>;
  outputTemplate: string;
};

export function parseExampleFile(fileContent: string): ParsedExample {
  const lines = fileContent.split('\n');

  const variablesToSet = [];
  const linesForTemplate = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1];

    linesForTemplate.push(currentLine);

    if (
      currentLine.startsWith('#') &&
      typeof nextLine === 'string' &&
      nextLine.includes('=')
    ) {
      const comment = currentLine.replace('#', '').trim();
      let [name, defaultValue] = nextLine.trim().split('=');
      name = name.trim();
      if (typeof defaultValue === 'string') {
        defaultValue = defaultValue.trim();
      }

      variablesToSet.push({
        name,
        comment,
        defaultValue: defaultValue || undefined,
      });

      linesForTemplate.push(`${name}={{${name}}}`);

      i++;
    }
  }

  return { variablesToSet, outputTemplate: linesForTemplate.join('\n') };
}
