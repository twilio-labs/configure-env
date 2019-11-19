import mock from 'mock-fs';
import * as path from 'path';
import { getExampleContent, parseArgs } from '../cli';

const defaultResult = {
  output: '.env',
  o: '.env',
  input: '.env.example',
  i: '.env.example',
  verbose: false,
  _: [],
  $0: path.relative(process.cwd(), process.argv[1]),
};

describe('parseArgs', () => {
  test('handles --output flag', () => {
    const args = ['--output', '.env.prod'];
    const output = parseArgs(args);
    expect(output).toEqual({
      ...defaultResult,
      output: '.env.prod',
      o: '.env.prod',
    });
  });

  test('handles -o flag', () => {
    const args = ['-o', '.env.prod'];
    const output = parseArgs(args);
    expect(output).toEqual({
      ...defaultResult,
      output: '.env.prod',
      o: '.env.prod',
    });
  });

  test('handles --input flag', () => {
    const args = ['--input', '.env.ci.example'];
    const output = parseArgs(args);
    expect(output).toEqual({
      ...defaultResult,
      input: '.env.ci.example',
      i: '.env.ci.example',
    });
  });

  test('handles -i flag', () => {
    const args = ['-i', '.env.ci.example'];
    const output = parseArgs(args);
    expect(output).toEqual({
      ...defaultResult,
      input: '.env.ci.example',
      i: '.env.ci.example',
    });
  });

  test('handles --verbose flag', () => {
    const args = ['--verbose'];
    const output = parseArgs(args);
    expect(output).toEqual({
      ...defaultResult,
      verbose: true,
    });
  });
});

describe('getExampleContent', () => {
  beforeEach(() => {
    const relativePathExample = `${process.cwd()}/.env.example`;
    mock({
      [relativePathExample]: `# Some demo\nAHOY=true`,
      '/tmp/demo/.env.example': '# Some absolute demo\nAHOY_AHOY=false',
    });
  });

  afterEach(() => {
    mock.restore();
  });

  test('reads relative file name content correctly', async () => {
    const content = await getExampleContent('.env.example');
    expect(content).toEqual(`# Some demo\nAHOY=true`);
  });

  test('reads absolute file name content correctly', async () => {
    const content = await getExampleContent('/tmp/demo/.env.example');
    expect(content).toEqual('# Some absolute demo\nAHOY_AHOY=false');
  });
});
