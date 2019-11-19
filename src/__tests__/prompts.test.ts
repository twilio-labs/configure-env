jest.mock('prompts');
import { createQuestions } from '../prompts';

describe('createQuestions', () => {
  test('creates a question for every entry', () => {
    const variablesToSet = [
      {
        name: 'TWILIO_ACCOUNT_SID',
        comment: 'Twilio Account SID',
        defaultValue: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      },
      {
        name: 'TWILIO_AUTH_TOKEN',
        comment: 'Twilio Auth Token',
        defaultValue: undefined,
      },
    ];

    const questions = createQuestions(
      { variablesToSet, outputTemplate: '' },
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
