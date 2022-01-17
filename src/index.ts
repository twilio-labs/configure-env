import * as fs from 'fs';
import { info, success } from 'log-symbols';
import { erase } from 'sisteransi';
import * as tty from 'tty';
import { createOutput } from './output';
import * as parserLib from './parser';
import { promptForVariables } from './prompts';
import * as validatorLib from './validators';

export type Config = {
  output: fs.WriteStream;
  promptStream: tty.WriteStream;
  exampleFileContent: string;
  outputFileContent?: string;
};

export async function configureEnv(config: Config) {
  const parsedExample = parserLib.parse(config.exampleFileContent);
  // Use default from existing .env values if file exists
  if(config.outputFileContent) {
    config.promptStream.write(
      `${info} ${config.output.path} already present using existing values as defaults\n`
    );
    const parsedEnv = await parserLib.parseAsObject(config.outputFileContent);
    parsedExample.variables.forEach(variable => {
      if ( variable.configurable && parsedEnv[variable.key]) {
        variable.default = parsedEnv[variable.key];
      }
    })
  }
  config.promptStream.write(
    `Configuring your environment. Please fill out the following info\n`
  );
  config.promptStream.write(`${info} To skip any field press Ctrl+C\n`);

  const answers = await promptForVariables(parsedExample, config.promptStream);
  const output = createOutput(parsedExample, answers);

  config.promptStream.write(erase.lines(parsedExample.variables.length + 2));

  config.output.write(output, 'utf8');

  config.promptStream.write(`${success} Environment has been configured.\n`);
  if (typeof config.output.close === 'function') {
    // we wrote to a file
    config.promptStream.write('File has successfully been created.');
  }
}

export const parser = parserLib;
export const validators = validatorLib;
