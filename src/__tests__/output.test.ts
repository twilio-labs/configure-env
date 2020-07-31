import { stripIndent } from 'common-tags';
import { createOutput } from '../output';
import { DEFAULT_ENTRY, ParseResult } from '../parser';

describe('createOutput', () => {
  test('templates variables correctly', () => {
    const parsedExample: ParseResult = {
      outputTemplate: stripIndent`
        # Twilio Account SID
        TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}
      `,
      variables: [
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Twilio Account SID',
          default: null,
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
    `);
  });

  test('handles undefined values', () => {
    const parsedExample: ParseResult = {
      outputTemplate: stripIndent`
        # Twilio Account SID
        TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}
      `,
      variables: [
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Twilio Account SID',
          default: null,
        },
      ],
    };
    const answers = {};
    const output = createOutput(parsedExample, answers);
    expect(output).toEqual(stripIndent`
      # Twilio Account SID
      TWILIO_ACCOUNT_SID=
    `);
  });
});
