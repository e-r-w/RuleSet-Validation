describe('rsGroupStore', function () {

  var data, result, expected;

  beforeEach(function(){
    module('ruleSetValidation');
  });

  describe('registerGroup', function() {
    it('should store one group', inject(function (rsGroupStore) {
      data = expected = {
        myGroup: {
          myInt: 123
        }
      };
      rsGroupStore.registerGroup('myGroup', 'myInt', 123);
      result = rsGroupStore.groups;
      expect(result).toEqual(expected);
    }));

    it('should store multiple groups', inject(function (rsGroupStore) {
      data = expected = {
        myGroup: {
          myInt: 123
        },
        anotherGroup: {
          myInt: 123
        }
      };
      rsGroupStore.registerGroup('myGroup', 'myInt', 123);
      rsGroupStore.registerGroup('anotherGroup', 'myInt', 123);
      result = rsGroupStore.groups;
      expect(result).toEqual(expected);
    }));

    it('should merge groups', inject(function (rsGroupStore) {
      rsGroupStore.groups = {
        myGroup: {
          myInt: 123
        }
      };
      expected = {
        myGroup: {
          myInt: 123,
          myOtherInt: 12345
        }
      };
      rsGroupStore.registerGroup('myGroup', 'myOtherInt', 12345);
      result = rsGroupStore.groups;
      expect(result).toEqual(expected);
    }));

  });

});