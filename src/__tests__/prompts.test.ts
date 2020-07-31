jest.mock('prompts');
import { DEFAULT_ENTRY, VariableDeclaration } from '../parser';
import { createQuestions } from '../prompts';

describe('createQuestions', () => {
  test('creates a question for every entry', () => {
    const variables: VariableDeclaration[] = [
      {
        ...DEFAULT_ENTRY,
        key: 'TWILIO_ACCOUNT_SID',
        description: 'Twilio Account SID',
        default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      },
      {
        ...DEFAULT_ENTRY,
        key: 'TWILIO_AUTH_TOKEN',
        description: 'Twilio Auth Token',
        default: null,
      },
    ];

    const questions = createQuestions(
      { variables, outputTemplate: '' },
      process.stderr
    );

    expect(questions).toEqual([
      {
        type: 'text',
        name: 'TWILIO_ACCOUNT_SID',
        message: 'Twilio Account SID',
        initial: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        stdout: process.stderr,
      },
      {
        type: 'text',
        name: 'TWILIO_AUTH_TOKEN',
        message: 'Twilio Auth Token',
        initial: undefined,
        stdout: process.stderr,
      },
    ]);
  });
});
