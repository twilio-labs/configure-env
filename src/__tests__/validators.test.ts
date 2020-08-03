import {
  baseValidator,
  getValidator,
  validateEmail,
  validateInteger,
  validateList,
  validateNestedList,
  validateNumber,
  validatePhoneNumber,
  validateSid,
  validateUrl,
} from '../validators';

describe('baseValidator', () => {
  test('should return true for any valid string', () => {
    expect(baseValidator('hello')).toEqual(true);
  });
});

describe('validatePhoneNumber', () => {
  test('should handle valid E.164 numbers', () => {
    expect(validatePhoneNumber('+18448144627')).toEqual(true);
  });

  test('should reject US numbers', () => {
    expect(validatePhoneNumber('(844) 814-4627')).toEqual(
      'Please enter a valid number in E.164 format. Example: +18448144627'
    );
  });

  test('should reject other numbers', () => {
    expect(validatePhoneNumber('1111111')).toEqual(
      'Please enter a valid number in E.164 format. Example: +18448144627'
    );
  });
});

describe('validateEmail', () => {
  test('should handle valid emails', () => {
    expect(validateEmail('open-source@twilio.com')).toEqual(true);
  });

  test('should reject emails without domain', () => {
    expect(validateEmail('open-source')).toEqual(
      'Please enter a valid email address.'
    );
  });

  test('should reject emails without recipient', () => {
    expect(validateEmail('twilio.com')).toEqual(
      'Please enter a valid email address.'
    );
  });
});

describe('validateUrl', () => {
  test('should handle relative URL paths', () => {
    expect(validateUrl('some/path')).toEqual(true);
  });

  test('should handle absolute URL paths', () => {
    expect(validateUrl('/some/path')).toEqual(true);
  });

  test('should full URLs', () => {
    expect(validateUrl('https://www.twilio.com/try-twilio')).toEqual(true);
  });
});

describe('validateSid', () => {
  test('should handle valid Account SID', () => {
    expect(validateSid('ACc2bdaa19578061b45a518a9dedb50000')).toEqual(true);
  });

  test('should handle valid Messaging SID', () => {
    expect(validateSid('SMc2bdaa19578061b45a518a9dedb50000')).toEqual(true);
  });

  test('should reject other values', () => {
    expect(validateSid('AC1345')).toEqual(
      'Please enter a valid SID. https://www.twilio.com/docs/glossary/what-is-a-sid'
    );
  });
});

describe('validateInteger', () => {
  test('should accept positive integers', () => {
    expect(validateInteger(100)).toEqual(true);
  });

  test('should accept negative integers', () => {
    expect(validateInteger(-200)).toEqual(true);
  });

  test('should handle 0', () => {
    expect(validateInteger(0)).toEqual(true);
  });

  test('should reject floating point numbers', () => {
    expect(validateInteger(0.122)).toEqual('Please enter a valid integer.');
  });

  test('should reject NaN', () => {
    expect(validateInteger(NaN)).toEqual('Please enter a valid integer.');
  });

  test('should reject Infinity', () => {
    expect(validateInteger(Infinity)).toEqual('Please enter a valid integer.');
  });
});

describe('validateNumbers', () => {
  test('should accept positive integers', () => {
    expect(validateNumber(100)).toEqual(true);
  });

  test('should accept negative integers', () => {
    expect(validateNumber(-200)).toEqual(true);
  });

  test('should handle 0', () => {
    expect(validateNumber(0)).toEqual(true);
  });

  test('should reject floating point numbers', () => {
    expect(validateNumber(0.122)).toEqual(true);
  });

  test('should accept positive integers as string', () => {
    expect(validateNumber('100')).toEqual(true);
  });

  test('should accept negative integers as string', () => {
    expect(validateNumber('-200')).toEqual(true);
  });

  test('should handle 0 as string', () => {
    expect(validateNumber('0')).toEqual(true);
  });

  test('should reject floating point numbers as string', () => {
    expect(validateNumber('0.122')).toEqual(true);
  });

  test('should reject random text', () => {
    expect(validateNumber('random')).toEqual('Please enter a valid number');
  });

  test('should reject NaN', () => {
    expect(validateNumber(NaN)).toEqual('Please enter a valid number');
  });

  test('should reject Infinity', () => {
    expect(validateNumber(Infinity)).toEqual('Please enter a valid number');
  });
});

describe('validateList', () => {
  test('should handle text lists', () => {
    expect(validateList('list(text)', 'hello,bye')).toEqual(true);
  });

  test('should handle phone_number lists', () => {
    expect(
      validateList('list(phone_number)', '+18448144627,+18448144627')
    ).toEqual(true);
  });

  test('should reject phone_number lists with invalid entries', () => {
    expect(
      validateList('list(phone_number)', '+18448144627,invalid,+18448144627')
    ).toEqual(
      'Please enter a valid number in E.164 format. Example: +18448144627'
    );
  });

  test('should reject values that are not lists', () => {
    expect(validateList('list(text)', 'something')).toEqual(
      'Please enter a list of values separated by commas'
    );
  });
});

describe('validateNestedLists', () => {
  test('should handle nested text lists', () => {
    expect(
      validateNestedList('nested_list(text,text)', 'hello,see you;hi,bye')
    ).toEqual(true);
  });

  test('should handle nested lists with different types', () => {
    expect(
      validateNestedList(
        'nested_list(text,phone_number)',
        'dom,+18448144627;twilio,+18448144627'
      )
    ).toEqual(true);
  });

  test('should reject if a nested entry has the wrong format', () => {
    expect(
      validateNestedList(
        'nested_list(text,phone_number)',
        'dom,invalid;twilio,+18448144627'
      )
    ).toEqual(
      'Please enter a valid number in E.164 format. Example: +18448144627'
    );
  });

  test('should reject values that are not nested lists', () => {
    expect(validateNestedList('nested_list(text,text)', 'hello,bye')).toEqual(
      'Please enter a list of lists. Like: itemA1,itemA2;itemB1,itemB2'
    );

    expect(validateNestedList('nested_list(text,text)', 'hello;bye')).toEqual(
      'Please enter a list of lists. Like: itemA1,itemA2;itemB1,itemB2'
    );
  });
});

describe('getValidator', () => {
  test('returns the base validator', () => {
    expect(getValidator('text').name).toEqual('baseValidator');
    expect(getValidator('secret').name).toEqual('baseValidator');
  });

  test('returns the respective validator', () => {
    expect(getValidator('phone_number').name).toEqual('validatePhoneNumber');
    expect(getValidator('email').name).toEqual('validateEmail');
    expect(getValidator('url').name).toEqual('validateUrl');
    expect(getValidator('integer').name).toEqual('validateInteger');
    expect(getValidator('number').name).toEqual('validateNumber');
  });

  test('returns baseValidator for unknown formats', () => {
    expect(getValidator('unknown').name).toEqual('baseValidator');
  });
});
