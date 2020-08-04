# .env File Schema

`configure-env` supports any valid `.env` file that can be parsed by libraries like [`dotenv`](https://npm.im/dotenv).

That means it supports:

- "variable declaration": key value pairs in the pattern: `KEY=VALUE`
- empty declarations are valid but **must** contain a `=`. Example: `KEY=`
- one key value pair per line
- empty lines are ignored
- lines beginning with # are treated as comments

Based on those rules, [special comment annotations](#special-comment-annotations) and [best effort guessing](#best-effort-guessing), this tool will extract meta information for each key value pair that can either be extracted using the `parse` or `parseFile` function or that will be used by the CLI component of `configure-env` to prompt users for input of said environment variables.

## Special Comment Annotations

Any comments that are immediately before a "variable declaration" will be evaluated in the context of the variable declaration. Special comments can be used to define:

- [`required`](#required)
- [`format`](#format)
- [`description`](#description)
- [`link`](#link)
- [`default`](#default)
- [`configurable`](#configurable)

These comments can be used in any order as long as they are right before the variable declaration with no empty line before it.

### `required`

Using `# required: true` or `# required: false` can define whether a variable has to be configured in order for the app to work.

**Default Value**: `true`

**Example `.env` file:**

```bash
# required: true
TWILIO_ACCOUNT_SID=
```

**Parsed Result (with omitted default values):**

```json
[{ "key": "TWILIO_ACCOUNT_SID", "required": true }]
```

### `format`

A format comment can be used to inform a user what types of value is being expected for a variable.

Valid values are:

- `text` (plain text)
- `phone_number` (representing a valid number in the [E.164 Phone Number Format](https://www.twilio.com/docs/glossary/what-e164))
- `email`
- `url` (full or relative path)
- `sid` ([Twilio specific resource identifier format](https://www.twilio.com/docs/glossary/what-is-a-sid). RegEx: `/^[A-Z]{2}[0-9a-f]{32}$/`)
- `integer` (specifically any whole number)
- `number` (any valid number including floating point numbers with `.` as floating point indicator)
- `secret` (the same as text but UIs might decide to hide the user input)
- `list(<X>)` (a comma separated list of values, where `<X>` defines any of the formats above). Example: `list(email)` for `support@twilio.com,open-source@twilio.com`. Use `text` for any type
- `nested_list(<X>,<Y>)` (a comma and semicolon separted list. often used for key value pairs. `<X>` and `<Y>` represent the format for the first any any following entry). Example: `nested_list(email,phone_number)` for: `help@twilio.com,+1222333444;support@twilio.com,+13334445555`

**Default:** `text`

**Example `.env` file:**

```bash
# required: true
# format: sid
TWILIO_ACCOUNT_SID=

# required: true
# format: secret
TWILIO_AUTH_TOKEN=

# required: false
# format: phone_number
MY_PHONE_NUMBER=
```

**Parsed Result (with omitted default values):**

```json
[
  { "key": "TWILIO_ACCOUNT_SID", "format": "sid", "required": true },
  { "key": "TWILIO_AUTH_TOKEN", "format": "secret", "required": true },
  { "key": "MY_PHONE_NUMBER", "format": "phone_number", "required": true }
]
```

### `description`

While there is some [best effort guessing](#best-effort-guessing) for the description, the perferred way is to explicitly define the description as this will always take prescendence.

Just like with any other value, white space will be trimmed off from the result.

Multi-line descriptions are not supported using this method. See the ["best effort guessing"](#best-effort-guessing) section for details on multi-line descriptions.

**Default:** See [best effort guessing](#best-effort-guessing)

**Example `.env` file:**

```bash
# required: true
# format: sid
# description: Your Twilio Account SID. Can be found in the Console.
TWILIO_ACCOUNT_SID=

# required: true
# format: secret
# description: Your Twilio Auth Token. Can be found in the Console.
TWILIO_AUTH_TOKEN=

# required: false
# format: phone_number
# description: Your personal phone number. Used for SMS responses.
MY_PHONE_NUMBER=
```

**Parsed Result (with omitted default values):**

```json
[
  {
    "key": "TWILIO_ACCOUNT_SID",
    "description": "Your Twilio Account SID. Can be found in the Console.",
    "format": "sid",
    "required": true
  },
  {
    "key": "TWILIO_AUTH_TOKEN",
    "description": "Your Twilio Auth Token. Can be found in the Console.",
    "format": "secret",
    "required": true
  },
  {
    "key": "MY_PHONE_NUMBER",
    "description": "Your personal phone number. Used for SMS responses.",
    "format": "phone_number",
    "required": true
  }
]
```

### `link`

This can be used to link a user to some additional information or to point them to places where they can retrieve the information. These links have to be valid URL formats.

**Default:** `null`

**Example `.env` file:**

```bash
# required: true
# format: sid
# description: Your Twilio Account SID. Can be found in the Console.
# link: https://www.twilio.com/console
TWILIO_ACCOUNT_SID=

# required: true
# format: secret
# description: Your Twilio Auth Token. Can be found in the Console.
# link: https://www.twilio.com/console
TWILIO_AUTH_TOKEN=

# required: false
# format: phone_number
# description: Your personal phone number. Used for SMS responses.
MY_PHONE_NUMBER=
```

**Parsed Result (with omitted default values):**

```json
[
  {
    "key": "TWILIO_ACCOUNT_SID",
    "link": "https://www.twilio.com/console",
    "description": "Your Twilio Account SID. Can be found in the Console.",
    "format": "sid",
    "required": true
  },
  {
    "key": "TWILIO_AUTH_TOKEN",
    "link": "https://www.twilio.com/console",
    "description": "Your Twilio Auth Token. Can be found in the Console.",
    "format": "secret",
    "required": true
  },
  {
    "key": "MY_PHONE_NUMBER",
    "description": "Your personal phone number. Used for SMS responses.",
    "format": "phone_number",
    "required": true
  }
]
```

### `default`

The recommended way to define a default value is to set it in the example variable declaration like so:

```bash
EXAMPLE=default-value
```

If for some reason you do not want to populate the value in that way, you can use the `# default:` comment.

The `# default:` comment will override the value specified in the variable declaration if both are present.

> Important: There won't be any parsing for the default value based on the format. The user of the parsed result is required to do so.

**Default:** `null`

**Example `.env` file:**

```bash
# description: Your own phone number
MY_PHONE_NUMBER=+12345678901

# description: Your Twilio number
# default: +12223334444
TWILIO_PHONE_NUMBER=
```

**Parsed Result (with omitted default values):**

```json
[
  {
    "key": "MY_PHONE_NUNMBER",
    "description": "Your own phone number",
    "default": "+12345678901"
  },
  {
    "key": "TWILIO_PHONE_NUNMBER",
    "description": "Your Twilio number",
    "default": "+12223334444"
  }
]
```

### `configurable`

If you want a variable to be copied over without the user being able to modify it, you can use the `configurable` option. It's important to note that the user could still change the value later on. Therefore you should still validate the value when using it.

**Default:** `true`

**Example `.env` file:**

```bash
# description: The path to the SMS webhook
# format: url
# configurable: false
TWILIO_SMS_WEBHOOK_URL=/sms
```

**Parsed Result (with omitted default values):**

```json
[
  {
    "key": "TWILIO_SMS_WEBHOOK_URL",
    "description": "Your own phone number",
    "format": "url",
    "configurable": false,
    "default": "/sms"
  }
]
```

## Best Effort Guessing

In order to be as compatible with existing `.env` files as possible, this schema will do some best effort guessing to determine meta information.

This currently includes

- `description`
- `default`

In all cases the special comments mentioned above will override the determined values

**Example `.env` file:**

```bash
# Set these environment variables

# Your Twilio Account SID
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Your Twilio Auth Token
# Get it in the Twilio Console
TWILIO_AUTH_TOKEN=

TWILIO_SMS_WEBHOOK_URL=
```

**Parsed Result (with omitted default values):**

```json
[
  {
    "key": "TWILIO_ACCOUNT_SID",
    "description": "Your Twilio Account SID",
    "default": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "key": "TWILIO_AUTH_TOKEN",
    "description": "Your Twilio Auth Token\nGet it in the Twilio Console",
    "default": null
  },
  {
    "key": "TWILIO_SMS_WEBHOOK_URL",
    "description": null,
    "default": null
  }
]
```

Please note that multi-line comments will be merged into single lines using `\n` as separator. UIs using this information might still decide to truncate the information. For long information consider using the `link:` comment.

## Type Information of Result

```ts
type BaseVariableFormat =
  | 'text'
  | 'phone_number'
  | 'email'
  | 'url'
  | 'sid'
  | 'integer'
  | 'number'
  | 'secret';
type VariableFormat =
  | BaseVariableFormat
  | ListFormat<BaseVariableFormat>
  | NestedListFormat<BaseVariableFormat, BaseVariableFormat>;

type VariableDeclaration = {
  key: string;
  required: boolean;
  format: VariableFormat;
  description: string | null;
  link: string | null;
  default: string | null;
  configurable: boolean;
};

type Result = VariableDeclaration[];
```
