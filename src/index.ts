import * as fs from 'fs';
import { info, success } from 'log-symbols';
import { erase } from 'sisteransi';
import * as tty from 'tty';
import { createOutput } from './output';
import * as parserLib from './parser';
import { promptForVariables } from './prompts';

export type Config = {
  output: fs.WriteStream;
  promptStream: tty.WriteStream;
  exampleFileContent: string;
};

export async function configureEnv(config: Config) {
  const parsedExample = parserLib.parse(config.exampleFileContent);

  config.promptStream.write(
    `Configuring your environment. Please fill out the following info\n`
  );
  config.promptStream.write(`${info} To skip any field press Ctrl+C\n`);

  const answers = await promptForVariables(parsedExample, config.promptStream);
  const output = createOutput(parsedExample, answers);

  config.promptStream.write(erase.lines(parsedExample.variables.length + 3));

  config.output.write(output, 'utf8');

  config.promptStream.write(`${success} Environment has been configured.\n`);
  if (typeof config.output.close === 'function') {
    // we wrote to a file
    config.promptStream.write('File has successfully been created.');
  }
}

export const parser = parserLib;
