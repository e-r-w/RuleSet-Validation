angular.module('ruleSetValidation', [])
    .directive('ruleSetValidate', ['rsValidator', function(rsValidator) {
      return {
        restrict: 'A',
        require: ['ngModel', '^form'],
        link: function(scope, element, attrs, ctrl) {
          var model = ctrl[0].$name,
              modelCtrl = ctrl[0],
              form = ctrl[1].$name;
          element.bind('blur', function() {
            modelCtrl.$dirty = true;
            rsValidator.validate(modelCtrl, model, this.value, form);
            scope.$digest();
          });
        }
      };
    }])
    .directive('ruleSetValidateGroup', ['rsGroupValidator', function(rsGroupValidator) {
      return {
        restrict: 'A',
        require: ['ngModel', '^form'],
        link: function(scope, element, attrs, ctrl) {
          var model = ctrl[0].$name,
              modelCtrl = ctrl[0],
              form = ctrl[1].$name,
              groups = attrs.ruleSetValidateGroup.split(',');
          element.bind('blur', function() {
            modelCtrl.$dirty = true;
            for(var i = 0; i < groups.length; i++){
              var group = groups[i];
              rsGroupValidator.validate(modelCtrl, model, group, this.value, form);
            }
            scope.$digest();
          });
        },
        template: function(element, attrs){
          // dummy input to create an associated ngModel controller
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
          for(message in asyncRules){
            if(asyncRules.hasOwnProperty(message)){
              var deferred = $q.defer();
              var bindObj = {message: message, ctrl: ctrl};
              rules[message](value, deferred).then(asyncCallback.bind(bindObj), asyncCallback.bind(bindObj));
            }
          }
          function asyncCallback(valid, message){
            message = message || this.message;
            this.ctrl.$setValidity(model, valid);
            if(!valid){
              this.ctrl.$error.message = message;
            }
            else {
              delete this.ctrl.$error.message;
            }
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
        validate: function(formCtrl){
          var formCtrlName = formCtrl.$name;
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
    .factory('rsStore', ['rsRules', function(rsRules){
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
        rules: {},
        rsRules: rsRules
      };
    }])
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
