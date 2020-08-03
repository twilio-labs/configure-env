import { stripIndent } from 'common-tags';
import normalize from 'normalize-newline';
import { DEFAULT_ENTRY, parse, removePrefix } from '../parser';

describe('removePrefix', () => {
  test('removes specified prefix with space', () => {
    expect(removePrefix('hello:', 'hello: world')).toEqual('world');
  });

  test('removes prefix without space', () => {
    expect(removePrefix('hello:', 'hello:world')).toEqual('world');
  });
});

describe('parse', () => {
  describe('outputTemplate results', () => {
    test('should handle empty files', () => {
      const file = ``;
      const result = parse(file);
      expect(normalize(result.outputTemplate)).toEqual('');
    });

    test('should handle files with just comments', () => {
      const file = stripIndent`
      # Test file
      #TWILIO_ACCOUNT_SID=
      
      # TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(normalize(result.outputTemplate)).toEqual(normalize(file));
    });

    test('should handle variables', () => {
      const file = stripIndent`
      # Test file
      
      # Your Twilio Account Sid
      TWILIO_ACCOUNT_SID=
      `;
      const result = parse(file);
      expect(normalize(result.outputTemplate)).toEqual(
        normalize(stripIndent`
      # Test file
      
      # Your Twilio Account Sid
      TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}
      `)
      );
    });

    test('should handle variables with default values', () => {
      const file = stripIndent`
      # Test file
      
      # Your Twilio Account Sid
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      `;
      const result = parse(file);
      expect(normalize(result.outputTemplate)).toEqual(
        normalize(stripIndent`
      # Test file
      
      # Your Twilio Account Sid
      TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}
      `)
      );
    });

    test('should handle multiple variables', () => {
      const file = stripIndent`
      # Test file
      
      # Your Twilio Account Sid
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # description: Your Twilio Auth Token
      # format: secret
      TWILIO_AUTH_TOKEN=
      `;
      const result = parse(file);
      expect(normalize(result.outputTemplate)).toEqual(
        normalize(stripIndent`
      # Test file
      
      # Your Twilio Account Sid
      TWILIO_ACCOUNT_SID={{TWILIO_ACCOUNT_SID}}
      
      # description: Your Twilio Auth Token
      # format: secret
      TWILIO_AUTH_TOKEN={{TWILIO_AUTH_TOKEN}}
      `)
      );
    });
  });

  describe('variable results', () => {
    test('should handle empty files', () => {
      const file = ``;
      const result = parse(file);
      expect(result.variables).toEqual([]);
    });

    test('should ignore files with only comments', () => {
      const file = stripIndent`
      # Test file
      #TWILIO_ACCOUNT_SID=
      
      # TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([]);
    });

    test('handles variables without any comments', () => {
      const file = stripIndent`
      # Test file
      
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_AUTH_TOKEN',
          default: null,
        },
      ]);
    });

    test('handles variables with regular comments', () => {
      const file = stripIndent`
      # Test file
      
      # Your Twilio Account SID
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # Your Twilio Auth Token
      TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Your Twilio Account SID',
          default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_AUTH_TOKEN',
          description: 'Your Twilio Auth Token',
          default: null,
        },
      ]);
    });

    test('handles variables with regular multi-line comments', () => {
      const file = stripIndent`
      # Test file
      
      # Your Twilio Account SID
      # Available at twilio.com/console
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # Your Twilio Auth Token
      TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description:
            'Your Twilio Account SID - Available at twilio.com/console',
          default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_AUTH_TOKEN',
          description: 'Your Twilio Auth Token',
          default: null,
        },
      ]);
    });

    test('recognizes description comment', () => {
      const file = stripIndent`
      # Test file
      
      # description: Your Twilio Account SID
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # description: Your Twilio Auth Token
      TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Your Twilio Account SID',
          default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_AUTH_TOKEN',
          description: 'Your Twilio Auth Token',
          default: null,
        },
      ]);
    });

    test('recognizes format comment', () => {
      const file = stripIndent`
      # Test file
      
      # description: Your Twilio Account SID
      # format: sid
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # description: Your Twilio Auth Token
      # format: secret
      TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Your Twilio Account SID',
          format: 'sid',
          default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_AUTH_TOKEN',
          description: 'Your Twilio Auth Token',
          format: 'secret',
          default: null,
        },
      ]);
    });

    test('handles invalid format values', () => {
      const file = stripIndent`
      # Test file
      
      # description: Your Twilio Account SID
      # format: boolean
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # description: Your Twilio Auth Token
      # format: secret
      TWILIO_AUTH_TOKEN=
    `;

      expect(() => parse(file)).toThrowError();
    });

    test('handles invalid list format values', () => {
      const file = stripIndent`
      # Test file
      
      # description: Your Twilio Account SID
      # format: list(boolean)
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # description: Your Twilio Auth Token
      # format: secret
      TWILIO_AUTH_TOKEN=
    `;

      expect(() => parse(file)).toThrowError();
    });

    test('handles invalid nested_list values', () => {
      const file = stripIndent`
      # Test file
      
      # description: Your Twilio Account SID
      # format: nest_list(phone_number,boolean)
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # description: Your Twilio Auth Token
      # format: secret
      TWILIO_AUTH_TOKEN=
    `;

      expect(() => parse(file)).toThrowError();
    });

    test('recognizes required comment', () => {
      const file = stripIndent`
      # Test file
      
      # description: your Twilio phone number
      # format: phone_number
      # required: true
      TWILIO_PHONE_NUMBER=+12223334444

      # description: Message to play
      # required: false
      MESSAGE=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_PHONE_NUMBER',
          format: 'phone_number',
          required: true,
          description: 'your Twilio phone number',
          default: '+12223334444',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'MESSAGE',
          required: false,
          description: 'Message to play',
          default: null,
        },
      ]);
    });

    test('recognizes link comment', () => {
      const file = stripIndent`
      # Test file
      
      # description: Your Twilio Account SID
      # format: sid
      # link: https://www.twilio.com/console
      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      
      # description: Your Twilio Auth Token
      # format: secret
      # link: https://www.twilio.com/console
      TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Your Twilio Account SID',
          format: 'sid',
          link: 'https://www.twilio.com/console',
          default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_AUTH_TOKEN',
          description: 'Your Twilio Auth Token',
          format: 'secret',
          link: 'https://www.twilio.com/console',
          default: null,
        },
      ]);
    });

    test('recognizes default comment', () => {
      const file = stripIndent`
      # Test file
      
      # description: Your Twilio Account SID
      # format: sid
      # link: https://www.twilio.com/console
      # default: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      TWILIO_ACCOUNT_SID=
      
      # description: Your Twilio Auth Token
      # format: secret
      # link: https://www.twilio.com/console
      TWILIO_AUTH_TOKEN=
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Your Twilio Account SID',
          format: 'sid',
          link: 'https://www.twilio.com/console',
          default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_AUTH_TOKEN',
          description: 'Your Twilio Auth Token',
          format: 'secret',
          link: 'https://www.twilio.com/console',
          default: null,
        },
      ]);
    });

    test('recognizes configurable comment', () => {
      const file = stripIndent`
      # Test file
      
      # description: Your Twilio Account SID
      # format: sid
      # link: https://www.twilio.com/console
      # default: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      # configurable: true
      TWILIO_ACCOUNT_SID=
      
      # description: Your Twilio Auth Token
      # format: secret
      # link: https://www.twilio.com/console
      # configurable: true
      TWILIO_AUTH_TOKEN=

      # description: The path to the SMS webhook
      # format: url
      # configurable: false
      TWILIO_SMS_WEBHOOK_URL=/sms
    `;
      const result = parse(file);
      expect(result.variables).toEqual([
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Your Twilio Account SID',
          format: 'sid',
          link: 'https://www.twilio.com/console',
          configurable: true,
          default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_AUTH_TOKEN',
          description: 'Your Twilio Auth Token',
          format: 'secret',
          link: 'https://www.twilio.com/console',
          configurable: true,
          default: null,
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_SMS_WEBHOOK_URL',
          description: 'The path to the SMS webhook',
          format: 'url',
          configurable: false,
          default: '/sms',
        },
      ]);
    });
  });
});
