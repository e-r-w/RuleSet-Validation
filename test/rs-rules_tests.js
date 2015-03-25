describe('rsRules', function () {

  var data, result, expected;

  beforeEach(function(){
    module('ruleSetValidation');
  });

  describe('required', function() {
    it('should invalidate empty/blank input', inject(function (rsRules) {
      data = '';
      expected = false;
      result = rsRules.required(data);
      expect(result).toEqual(expected);
    }));

    it('should invalidate undefined input', inject(function (rsRules) {
      data = undefined;
      expected = false;
      result = rsRules.required(data);
      expect(result).toEqual(expected);
    }));

    it('should validate string', inject(function (rsRules) {
      data = 'this is a test';
      expected = true;
      result = rsRules.required(data);
      expect(result).toEqual(expected);
    }));

    it('should validate numbers', inject(function (rsRules) {
      data = 12345;
      expected = true;
      result = rsRules.required(data);
      expect(result).toEqual(expected);
    }));
  });

  describe('numbersOnly', function() {
    it('should invalidate characters', inject(function (rsRules) {
      data = 'abc';
      expected = false;
      result = rsRules.numbersOnly(data);
      expect(result).toEqual(expected);
    }));

    it('should invalidate empty strings', inject(function (rsRules) {
      data = '';
      expected = false;
      result = rsRules.numbersOnly(data);
      expect(result).toEqual(expected);
    }));

    it('should invalidate combinations', inject(function (rsRules) {
      data = '1e2e3e4';
      expected = false;
      result = rsRules.numbersOnly(data);
      expect(result).toEqual(expected);
    }));

    it('should validate number strings', inject(function (rsRules) {
      data = '123';
      expected = true;
      result = rsRules.numbersOnly(data);
      expect(result).toEqual(expected);
    }));

    it('should validate numbers', inject(function (rsRules) {
      data = 123;
      expected = true;
      result = rsRules.numbersOnly(data);
      expect(result).toEqual(expected);
    }));
  });

  describe('setLength', function() {
    it('should detect invalid string lengths', inject(function (rsRules) {
      data = 'abc';
      expected = false;
      result = rsRules.setLength(10)(data);
      expect(result).toEqual(expected);
    }));

    it('should detect valid string lengths', inject(function (rsRules) {
      data = 'abc';
      expected = true;
      result = rsRules.setLength(3)(data);
      expect(result).toEqual(expected);
    }));
  });

  describe('minLength', function() {
    it('should detect invalid string lengths', inject(function (rsRules) {
      data = 'abc';
      expected = false;
      result = rsRules.minLength(10)(data);
      expect(result).toEqual(expected);
    }));

    it('should detect valid string lengths', inject(function (rsRules) {
      data = 'abc12345';
      expected = true;
      result = rsRules.minLength(5)(data);
      expect(result).toEqual(expected);
    }));
  });

  describe('maxLength', function() {
    it('should detect invalid string lengths', inject(function (rsRules) {
      data = 'abc12345';
      expected = false;
      result = rsRules.maxLength(5)(data);
      expect(result).toEqual(expected);
    }));

    it('should detect valid string lengths', inject(function (rsRules) {
      data = 'abc';
      expected = true;
      result = rsRules.maxLength(5)(data);
      expect(result).toEqual(expected);
    }));
  });

  describe('regex', function() {
    it('should validate with string', inject(function (rsRules) {
      data = 'abc12345';
      expected = false;
      result = rsRules.regex('/^[0-9]+$/')(data);
      expect(result).toEqual(expected);
    }));

    it('should validate with regex', inject(function (rsRules) {
      data = 'abc12345';
      expected = false;
      result = rsRules.regex(/^[0-9]+$/)(data);
      expect(result).toEqual(expected);
    }));
  });

});