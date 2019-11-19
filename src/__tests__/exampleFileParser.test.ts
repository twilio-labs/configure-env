import { stripIndent } from 'common-tags';
import { parseExampleFile } from '../exampleFileParser';

describe('parseExampleFile', () => {
  test('handles no variables with comment header', () => {
    const content = stripIndent`
      CI=true
      PORT=9000

      # Some closing comment
    `;

    const parsed = parseExampleFile(content);
    expect(parsed.variablesToSet).toEqual([]);
    expect(parsed.outputTemplate).toEqual(stripIndent`
      CI=true
      PORT=9000

      # Some closing comment
    `);
  });

  test('handles one variable with comment header', () => {
    const content = stripIndent`
      CI=true
      PORT=9000

      # Twilio Account SID
      TWILIO_ACCOUNT_SID=

      # Some closing comment
    `;

    const parsed = parseExampleFile(content);
    expect(parsed.variablesToSet).toEqual([
      {
        name: 'TWILIO_ACCOUNT_SID',
        comment: 'Twilio Account SID',
        defaultValue: undefined,
      },
    ]);
    expect(parsed.outputTemplate).toEqual(stripIndent`
      CI=true
      PORT=9000

      # Twilio Account SID
      TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}

      # Some closing comment
    `);
  });

  test('handles variable with default value', () => {
    const content = stripIndent`
      CI=true
      PORT=9000

      # Twilio Account SID
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

      # Some closing comment
    `;

    const parsed = parseExampleFile(content);
    expect(parsed.variablesToSet).toEqual([
      {
        name: 'TWILIO_ACCOUNT_SID',
        comment: 'Twilio Account SID',
        defaultValue: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      },
    ]);
    expect(parsed.outputTemplate).toEqual(stripIndent`
      CI=true
      PORT=9000

      # Twilio Account SID
      TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}

      # Some closing comment
    `);
  });

  test('handles multiple variables', () => {
    const content = stripIndent`
      CI=true
      PORT=9000

      # Twilio Account SID
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

      # Twilio Auth Token
      TWILIO_AUTH_TOKEN=

      # Some closing comment
    `;

    const parsed = parseExampleFile(content);
    expect(parsed.variablesToSet).toEqual([
      {
        name: 'TWILIO_ACCOUNT_SID',
        comment: 'Twilio Account SID',
        defaultValue: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      },
      {
        name: 'TWILIO_AUTH_TOKEN',
        comment: 'Twilio Auth Token',
        defaultValue: undefined,
      },
    ]);
    expect(parsed.outputTemplate).toEqual(stripIndent`
      CI=true
      PORT=9000

      # Twilio Account SID
      TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}

      # Twilio Auth Token
      TWILIO_AUTH_TOKEN={{TWILIO_AUTH_TOKEN}}

      # Some closing comment
    `);
  });
});
