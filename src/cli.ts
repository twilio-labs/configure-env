import * as fs from 'fs';
import { resolve } from 'path';
import { WriteStream } from 'tty';
import { promisify } from 'util';
import yargs, { Arguments } from 'yargs';
import { Config, configureEnv } from './index';

const readFile = promisify(fs.readFile);

export interface CliArguments extends Arguments {
  [x: string]: unknown;
  output: string;
  verbose: boolean;
  input: string;
}

export function parseArgs(args: string[]): CliArguments {
  const parsed = yargs
    .usage(
      'Prompts user for environment variables and generates .env files based on a .env.example file\n'
    )
    .usage('Usage:\n  $0 -o [outputFile] -i [exampleFile]')
    .epilog(
      'This project is part of Twilio Labs. Please file any issues github.com/twilio-labs/configure-env'
    )
    .example(
      'npx configure-env',
      'Reads a .env.example file in the current directory and creates a .env file'
    )
    .example(
      '$0 | cat',
      'The output can be either written to a file or piped to another process'
    )
    .options({
      output: {
        type: 'string',
        default: '.env',
        alias: 'o',
        desc: 'Location of the .env file that should be written',
      },
      input: {
        type: 'string',
        default: '.env.example',
        alias: 'i',
        desc: 'Location of input .env.example file for prompts',
      },
      verbose: { type: 'boolean', default: false },
    })
    .parse(args);

  return parsed;
}

export async function getExampleContent(fileName: string): Promise<string> {
  const fullPath = resolve(process.cwd(), fileName);
  return readFile(fullPath, 'utf8');
}


export async function getOutputContent(fileName: string): Promise<string | undefined> {
  const fullPath = resolve(process.cwd(), fileName);
  if(fs.existsSync(fullPath)) {
    return readFile(fullPath, 'utf8');
  }
}

export function getOutputStream(fileName: string): fs.WriteStream {
  const fullPath = resolve(process.cwd(), fileName);
  return fs.createWriteStream(fullPath);
}

export async function cli(
  args: string[],
  ttyOutStream: WriteStream,
  promptStream: WriteStream
) {
  const options = parseArgs(args);
  const exampleFileContent = await getExampleContent(options.input);
  const outputFileContent = await getOutputContent(options.output);
  const output = !ttyOutStream.isTTY
    ? ((ttyOutStream as unknown) as fs.WriteStream)
    : getOutputStream(options.output);

  const config: Config = {
    outputFileContent,
    exampleFileContent,
    output,
    promptStream,
  };
  return configureEnv(config);
}
