angular.module('ruleSetValidation', [])
    .directive('ruleSetValidate', ['rsValidator', function(rsValidator) {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var model = attrs.name;
          var form = attrs.ruleSetValidate;
          element.bind('blur', function() {
            ctrl.$dirty = true;
            rsValidator.validate(ctrl, model, this.value, form);
            scope.$digest();
          });
        }
      };
    }])
    .directive('ruleSetValidateGroup', ['rsGroupValidator', function(rsGroupValidator) {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var model = attrs.name;
          var form = attrs.ruleSetValidate;
          var group = attrs.ruleSetValidateGroup;
          element.bind('blur', function() {
            ctrl.$dirty = true;
            rsGroupValidator.validate(ctrl, model, group, this.value, form);
            scope.$digest();
          });
        },
        template: function(element, attrs){
          return '<input data-ng-model="' + attrs.ruleSetValidateGroup + '" name="' +attrs.ruleSetValidateGroup + '" style="display: none;"/>'
        }
      };
    }])
    .factory('rsValidator', ['$q', 'rsStore', function($q, rsStore){
      return {
        validate: function(ctrl, model, value, form){

          // Run through synchronous rules from the rule set
          var rules = rsStore.getRules(model, form);
          for(var message in rules){
            var isValid = rules[message](value);
            ctrl.$setValidity(model, isValid);
            if(!isValid){
              ctrl.$error.message = message;
              break;
            }
            else {
              delete ctrl.$error.message;
            }
          }

          // Run through asynchronous rules from the rule set
          var asyncRules = rsStore.getAsyncRules(model, form);
          var callBack = function(valid){
            ctrl.$setValidity(model, valid);
            if(!isValid){
              ctrl.$error.message = message;
            }
            else {
              delete ctrl.$error.message;
            }
          };
          for(message in asyncRules){
            var deferred = $q.defer();
            rules[message](value, deferred).then(callback, callBack);
          }

        }
      };
    }])
    .factory('rsGroupValidator', ['rsValidator', 'rsGroupStore', function(rsValidator, rsGroupStore){
      return {
        validate: function(ctrl, model, group, value, form){
          var groupFromStore = rsGroupStore.registerGroup(group, model, value);
          rsValidator.validate(ctrl, model, groupFromStore, form);
        }
      };
    }])
    .factory('rsFormValidator', ['rsValidator', 'rsStore', 'rsGroupStore', function(rsValidator, rsStore, rsGroupStore){
      return {
        validate: function(formCtrl, formCtrlName){
          var props = rsStore.getFormRules(formCtrlName);
          for(var prop in props){
            var value = formCtrl[prop] ? formCtrl[prop].$viewValue : rsGroupStore.groups[prop];
            rsValidator.validate(formCtrl[prop], prop, value, formCtrlName);
          }
        }
      };
    }])
    .factory('rsGroupStore', function(){
      return {
        registerGroup: function(group, name, value){
          var groupObj = {};
          groupObj[group] = {};
          groupObj[group][name] = value;
          if(this.groups[group]) {
            angular.extend(this.groups[group], groupObj[group]);
          }
          else {
            angular.extend(this.groups, groupObj);
          }
          return this.groups[group];
        },
        groups: {}
      };
    })
    .factory('rsStore', function(){
      return {
        addRules: function(ruleSet){
          angular.extend(this.rules, ruleSet);
        },
        getRules: function(ruleName, formName){
          return formName ? this.rules[formName][ruleName] : this.rules[ruleName];
        },
        getAsyncRules: function(ruleName, formName){
          return formName ? this.rules[formName][ruleName + ':async'] : this.rules[ruleName + ':async'];
        },
        getFormRules: function(formName){
          return this.rules[formName];
        },
        rules: {}
      };
    })
    .factory('rsRules', function(){
      return {
        required: function(value){
          if(!angular.isDefined(value)){
            return false;
          }
          if(typeof value === 'string'){
            return value !== '';
          }
          return true;
        },
        numbersOnly: function(value){
          return (/^[0-9]+$/).test(value);
        },
        setLength: function(length) {
          return function(value){
            return value.length === length;
          }
        },
        minLength: function(length) {
          return function(value){
            return value.length >= length;
          }
        },
        maxLength: function(length) {
          return function(value){
            return value.length <= length;
          }
        },
        regex: function(pattern) {
          return function(value){
            if(typeof pattern === "string"){
              return new RegExp(pattern).test(value);
            }
            else { // assume regex
              return pattern.test(value);
            }
          }
        },
        email: function(value){
          // angular 1.2.27 regex pattern for email
          (/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/).test(value);
        }
      };
    });
