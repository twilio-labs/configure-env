import { stripIndent } from 'common-tags';
import { ParsedExample } from '../exampleFileParser';
import { createOutput } from '../output';

describe('createOutput', () => {
  test('templates variables correctly', () => {
    const parsedExample: ParsedExample = {
      outputTemplate: stripIndent`
        # Twilio Account SID
        TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}

        PORT=3000
      `,
      variablesToSet: [
        {
          name: 'TWILIO_ACCOUNT_SID',
          comment: 'Twilio Account SID',
          defaultValue: undefined,
        },
      ],
    };
    const answers = {
      TWILIO_ACCOUNT_SID: 'ACyyyyy',
    };
    const output = createOutput(parsedExample, answers);
    expect(output).toEqual(stripIndent`
      # Twilio Account SID
      TWILIO_ACCOUNT_SID="ACyyyyy"

      PORT=3000
    `);
  });

  test('handles undefined values', () => {
    const parsedExample: ParsedExample = {
      outputTemplate: stripIndent`
        # Twilio Account SID
        TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}

        PORT=3000
      `,
      variablesToSet: [
        {
          name: 'TWILIO_ACCOUNT_SID',
          comment: 'Twilio Account SID',
          defaultValue: undefined,
        },
      ],
    };
    const answers = {};
    const output = createOutput(parsedExample, answers);
    expect(output).toEqual(stripIndent`
      # Twilio Account SID
      TWILIO_ACCOUNT_SID=

      PORT=3000
    `);
  });
});
