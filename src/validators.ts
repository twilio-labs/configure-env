import emailRegex from 'email-regex';
import { PhoneNumberUtil } from 'google-libphonenumber';
import {
  BaseVariableFormat,
  extractListFormat,
  extractMapFormats,
} from './parser';

const SID_REGEX = /^[A-Z]{2}[a-f0-9]{32}$/;

/**
 * Validates that the input is a string
 * @param input input to validate
 */
export function baseValidator(input: string): boolean | string {
  return typeof input === 'string';
}

/**
 * Validates that a number is a valid E.164. Will reject anything that's not a valid number
 * @param input text to validate
 */
export function validatePhoneNumber(input: string): boolean | string {
  const phoneUtil = PhoneNumberUtil.getInstance();
  try {
    const num = phoneUtil.parseAndKeepRawInput(input);

    if (phoneUtil.isValidNumber(num)) {
      return true;
    }
  } catch (err) {
    //
  }

  return 'Please enter a valid number in E.164 format. Example: +18448144627';
}

/**
 * Validates that a text is a valid email
 * @param input text to validate
 */
export function validateEmail(input: string): boolean | string {
  const valid = emailRegex({ exact: true }).test(input);
  if (valid) {
    return true;
  }

  return `Please enter a valid email address.`;
}

/**
 * Verifies that a given string is a valid URL by trying to parse it
 * @param input text to verify
 */
export function validateUrl(input: string): boolean | string {
  try {
    // try parsing by itself
    new URL(input);
    return true;
  } catch (err) {
    try {
      // try parsing if it's a relative/absolute URL
      new URL(input, 'https://www.twilio.com');
      return true;
    } catch (err) {
      //
    }
  }
  return `Received an invalid URL.`;
}

/**
 * Validates a given string against Twilio's SID format RegEx
 * @param input text to verify
 */
export function validateSid(input: string): boolean | string {
  if (SID_REGEX.test(input)) {
    return true;
  }

  return 'Please enter a valid SID. https://www.twilio.com/docs/glossary/what-is-a-sid';
}

/**
 * Verifies if a given number is a valid integer
 * @param input number to verify
 */
export function validateInteger(input: number): boolean | string {
  const valid = input % 1 === 0;

  if (valid) {
    return true;
  }

  return 'Please enter a valid integer.';
}

/**
 * Validates if a number is a valid finite number
 * @param input number to verify
 */
export function validateNumber(input: number | string): boolean | string {
  if (typeof input === 'string') {
    input = parseFloat(input);
  }

  if (!Number.isNaN(input) && isFinite(input)) {
    return true;
  }

  return 'Please enter a valid number';
}

type ValidatorFunction = (input: any) => boolean | string;

export const BaseValidators: {
  [key in BaseVariableFormat]: ValidatorFunction;
} & { [key: string]: ValidatorFunction } = {
  text: baseValidator,
  phone_number: validatePhoneNumber,
  email: validateEmail,
  url: validateUrl,
  sid: validateSid,
  integer: validateInteger,
  number: validateNumber,
  secret: baseValidator,
};

/**
 * Validates the input using a list format including validating the respective elements
 *
 * @param format Format string wrapped in list()
 * @param input input to validate
 */
export function validateList(format: string, input: string): boolean | string {
  try {
    const extractedFormat = extractListFormat(format);

    if (!input.includes(',')) {
      return 'Please enter a list of values separated by commas';
    }

    const values = input.split(',').map(x => x.trim());
    for (const val of values) {
      const valid = BaseValidators[extractedFormat](val);
      if (valid !== true) {
        return valid;
      }
    }
    return true;
  } catch (err) {
    return baseValidator(input);
  }
}

/**
 * Validates the input using a map format including validating the respective elements
 *
 * @param format Format string wrapped in map()
 * @param input input to validate
 */
export function validateMap(format: string, input: string): boolean | string {
  try {
    const [keyFormat, valueFormat] = extractMapFormats(format);

    if (!input.includes(',') || !input.includes(';')) {
      return 'Please enter a list of lists. Like: itemA1,itemA2;itemB1,itemB2';
    }

    const entries = input.split(';').map(x => x.trim());
    for (const entry of entries) {
      const [key, ...splitValue] = entry.split(',');

      const validKey = BaseValidators[keyFormat](key.trim());
      if (validKey !== true) {
        return `Invalid Key. ${validKey}`;
      }

      const value = splitValue.join(',');
      const validValue = BaseValidators[valueFormat](value);
      if (validValue !== true) {
        return `Invalid Value. ${validValue}`;
      }
    }
    return true;
  } catch (err) {
    return baseValidator(input);
  }
}

/**
 * Returns the right validator function depending on the format
 * @param format a VariableFormat string
 */
export function getValidator(
  format: BaseVariableFormat | string
): (input: any) => boolean | string {
  if (BaseValidators.hasOwnProperty(format)) {
    return BaseValidators[format];
  }

  if (format.startsWith('list(')) {
    return input => {
      return validateList(format, input);
    };
  }

  if (format.startsWith('map(')) {
    return input => {
      return validateMap(format, input);
    };
  }

  return baseValidator;
}
