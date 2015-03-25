describe('rsStore', function () {

  var data, result, expected;

  beforeEach(function(){
    module('ruleSetValidation');
  });

  describe('addRules', function() {
    it('should store one rule', inject(function (rsStore) {
      data = expected = {
        myField: {
          "this is a test": function(){
            return true;
          }
        }
      };
      rsStore.addRules(data);
      result = rsStore.rules;
      expect(result).toEqual(data);
    }));

    it('should store multiple rules', inject(function (rsStore) {
      expected = data = {
        myField: {
          "this is a test": function(){
            return true;
          }
        }
      };
      rsStore.addRules(data);
      data = {
        myField: {
          "this is a test": function(){
            return true;
          }
        }
      };
      rsStore.addRules(data);
      angular.extend(expected, data);
      result = rsStore.rules;
      expect(result).toEqual(expected);
    }));
  });

  describe('getRules', function() {
    it('should get top level rule', inject(function (rsStore) {
      data = expected = {
        "this is a test": function(){
          return true;
        }
      };
      rsStore.rules = {
        myField: data
      };
      result = rsStore.getRules('myField');
      expect(result).toEqual(expected);
    }));

    it('should get form level rule', inject(function (rsStore) {
      data = expected = {
        "this is a test": function(){
          return true;
        }
      };
      rsStore.rules = {
        myForm: {
          myField: data
        }
      };
      result = rsStore.getRules('myField', 'myForm');
      expect(result).toEqual(expected);
    }));

    it('should get form and top level rule', inject(function (rsStore) {
      data = expected = {
        "this is a test": function(){
          return true;
        }
      };
      rsStore.rules = {
        myForm: {
          myField: data
        },
        myField: data
      };
      result = rsStore.getRules('myField');
      expect(result).toEqual(expected);
      result = rsStore.getRules('myField', 'myForm');
      expect(result).toEqual(expected);
    }));

  });

  describe('getAsyncRules', function() {

    it('should get asynchronous rules', inject(function (rsStore) {
      data = expected = {
        "this is a test": function(){
          return true;
        }
      };
      rsStore.rules = {
        'myField:async': data
      };
      result = rsStore.getAsyncRules('myField');
      expect(result).toEqual(expected);
    }));

    it('should ignore synchronous rules', inject(function (rsStore) {
      data = expected = {
        "this is a test": function(){
          return true;
        }
      };
      rsStore.rules = {
        'myField:async': data,
        myField: {
          "this is synchronous validation": function(){
            return true;
          }
        }
      };
      result = rsStore.getAsyncRules('myField');
      expect(result).toEqual(expected);
    }));


  });

  describe('getFormRules', function() {

    it('should get all rules for the form', inject(function (rsStore) {
      data = expected = {
        myField: {
          "this is a test": function(){
            return true;
          }
        }
      };
      rsStore.rules = {
        myForm: data
      };
      result = rsStore.getFormRules('myForm');
      expect(result).toEqual(expected);
    }));

    it('should ignore top level rules', inject(function (rsStore) {
      data = expected = {
        myField: {
          "this is a test": function(){
            return true;
          }
        }
      };
      rsStore.rules = {
        myForm: data,
        myField: {
          "this is validation for another field": function(){
            return true;
          }
        }
      };
      result = rsStore.getFormRules('myForm');
      expect(result).toEqual(expected);
    }));

  });

});