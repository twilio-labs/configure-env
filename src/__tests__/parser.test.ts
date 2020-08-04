import { stripIndent } from 'common-tags';
import normalize from 'normalize-newline';
import {
  DEFAULT_ENTRY,
  parse,
  parseVariableDeclarationLine,
  removePrefix,
} from '../parser';

describe('removePrefix', () => {
  test('removes specified prefix with space', () => {
    expect(removePrefix('hello:', 'hello: world')).toEqual('world');
  });

  test('removes prefix without space', () => {
    expect(removePrefix('hello:', 'hello:world')).toEqual('world');
  });

  test('leaves string untouched if prefix is missing', () => {
    expect(removePrefix('hello:', 'no hello')).toEqual('no hello');
  });
});

describe('parseVariableDeclarationLine', () => {
  test('ignores empty line', () => {
    const line = '';
    expect(parseVariableDeclarationLine(DEFAULT_ENTRY, line)).toEqual(
      DEFAULT_ENTRY
    );
  });

  test('ignores variable name without =', () => {
    const line = 'ACCOUNT_SID';
    expect(parseVariableDeclarationLine(DEFAULT_ENTRY, line)).toEqual(
      DEFAULT_ENTRY
    );
  });

  test('parses variable with no default', () => {
    const line = 'ACCOUNT_SID=';
    expect(parseVariableDeclarationLine(DEFAULT_ENTRY, line)).toEqual({
      ...DEFAULT_ENTRY,
      key: 'ACCOUNT_SID',
    });
  });

  test('parses variable with default', () => {
    const line = 'ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    expect(parseVariableDeclarationLine(DEFAULT_ENTRY, line)).toEqual({
      ...DEFAULT_ENTRY,
      key: 'ACCOUNT_SID',
      default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
  });

  test('parses variable with default in double quotes', () => {
    const line = 'ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"';
    expect(parseVariableDeclarationLine(DEFAULT_ENTRY, line)).toEqual({
      ...DEFAULT_ENTRY,
      key: 'ACCOUNT_SID',
      default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
  });

  test('parses variable with default in single quotes', () => {
    const line = `ACCOUNT_SID='ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`;
    expect(parseVariableDeclarationLine(DEFAULT_ENTRY, line)).toEqual({
      ...DEFAULT_ENTRY,
      key: 'ACCOUNT_SID',
      default: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
  });

  test('parses variable with escaped quotes', () => {
    const line = `GREETING="Hello \"World\""`;
    expect(parseVariableDeclarationLine(DEFAULT_ENTRY, line)).toEqual({
      ...DEFAULT_ENTRY,
      key: 'GREETING',
      default: 'Hello "World"',
    });
  });

  test('parses variable with escaped quotes', () => {
    const line = `GREETING='Hello \'World\''`;
    expect(parseVariableDeclarationLine(DEFAULT_ENTRY, line)).toEqual({
      ...DEFAULT_ENTRY,
      key: 'GREETING',
      default: `Hello 'World'`,
    });
  });

  test('throws error for invalid characters', () => {
    const line = `GREETING VALUE='Hello \'World\''`;
    expect(() =>
      parseVariableDeclarationLine(DEFAULT_ENTRY, line)
    ).toThrowError();
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
            'Your Twilio Account SID\nAvailable at twilio.com/console',
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

      # description: Your Twilio Phone Number
      # format: phone_number
      TWILIO_PHONE_NUMBER=

      # description: Default message to send
      # format: text
      DEFAULT_MESSAGE="Hi there how are you?"

      # description: The path for the SMS webhook
      # format: url
      TWILIO_SMS_WEBHOOK_URL=/sms

      # description: The PORT the server should run on
      # format: integer
      PORT=8080

      # description: Your support email
      # format: email
      SUPPORT_EMAIL=help@twilio.com

      # description: The rudimentary value of PI
      # format: number
      PI=3.14

      # description: list of valid callers
      # format: list(phone_number)
      VALID_CALLERS=+12223334444,+13334445555

      # description: address book
      # format: nested_list(text,phone_number)
      ADDRESS_BOOK=dom,+12223334444;phil,+13334445555
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
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_PHONE_NUMBER',
          description: 'Your Twilio Phone Number',
          format: 'phone_number',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'DEFAULT_MESSAGE',
          description: 'Default message to send',
          format: 'text',
          default: 'Hi there how are you?',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'TWILIO_SMS_WEBHOOK_URL',
          description: 'The path for the SMS webhook',
          format: 'url',
          default: '/sms',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'PORT',
          description: 'The PORT the server should run on',
          format: 'integer',
          default: '8080',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'SUPPORT_EMAIL',
          description: 'Your support email',
          format: 'email',
          default: 'help@twilio.com',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'PI',
          description: 'The rudimentary value of PI',
          format: 'number',
          default: '3.14',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'VALID_CALLERS',
          description: 'list of valid callers',
          format: 'list(phone_number)',
          default: '+12223334444,+13334445555',
        },
        {
          ...DEFAULT_ENTRY,
          key: 'ADDRESS_BOOK',
          description: 'address book',
          format: 'nested_list(text,phone_number)',
          default: 'dom,+12223334444;phil,+13334445555',
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

    test('throws error for invalid required value', () => {
      const file = stripIndent`
      # Test file

      # description: Message to play
      # required: number
      MESSAGE=
    `;
      expect(() => parse(file)).toThrowError();
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
