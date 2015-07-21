angular.module('ruleSetValidation', [])
  .directive('ruleSetValidate', ['rsValidator', function(rsValidator) {
    return {
      restrict: 'A',
      require: ['ngModel', '^form'],
      link: function(scope, element, attrs, ctrl) {
        var model = ctrl[0].$name,
          modelCtrl = ctrl[0],
          form = ctrl[1],
          event = element[0].nodeName === 'INPUT' && element[0].type !== 'radio' ? 'blur' : 'change';
        //remove default angular email validation and set the correct starting validation state
          modelCtrl.$parsers = [];
        element.bind(event, function() {
          modelCtrl.$parsers = [];
          modelCtrl.$dirty = true;
          rsValidator.validate(modelCtrl, model, this.value, form);
          scope.$digest();
        });
      }
    };
  }])
  .directive('ruleSetRevalidate', ['$timeout', 'rsValidator', function($timeout, rsValidator) {
    return {
      restrict: 'A',
      require: ['ngModel', '^form'],
      link: function(scope, element, attrs, ctrl) {
        var form = ctrl[1];
        var fields = attrs.ruleSetRevalidate.split(',');
        var event = element[0].nodeName === 'INPUT' && element[0].type !== 'radio' ? 'blur' : 'change';
        element.bind(event, function(){
          angular.forEach(fields, function(field){
            form[field].$parsers = [];
            form[field].$dirty = true;
            $timeout(function(){
              rsValidator.validate(form[field], field, form[field].$viewValue, form);
              scope.$apply();
            }, 10);
          });
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
          form = ctrl[1],
          groups = attrs.ruleSetValidateGroup.split(','),
          event = element[0].nodeName === 'INPUT' && element[0].type !== 'radio' ? 'blur' : 'change';
        element.bind(event, function() {
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
        var rules = rsStore.getRules(model, form.$name);
        for(var message in rules){
          var isValid = rules[message](value, form);
          ctrl.$setValidity(model, isValid);
          if(!isValid){
            ctrl.$error.message = message;
            break;
          }
          else {
            ctrl.$error = {};
            if(form.$error){
              delete form.$error[model];
            }
          }
        }

        // Run through asynchronous rules from the rule set
        var asyncRules = rsStore.getAsyncRules(model, form.$name);
        for(message in asyncRules){
          if(asyncRules.hasOwnProperty(message)){
            var deferred = $q.defer();
            var bindObj = {message: message, ctrl: ctrl};
            asyncRules[message](value, form, deferred).then(asyncCallback.bind(bindObj), asyncCallback.bind(bindObj));
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
        rsValidator.validate(form[group], group, groupFromStore, form);
      },
      formValidate: rsValidator.validate
    };
  }])
  .factory('rsFormValidator', ['rsValidator', 'rsGroupValidator', 'rsStore', 'rsGroupStore', function(rsValidator, rsGroupValidator, rsStore, rsGroupStore){
    return {
      validate: function(formCtrl){
        var formCtrlName = formCtrl.$name;
        var props = rsStore.getFormRules(formCtrlName);
        for(var prop in props){
          var group = rsGroupStore.groups[prop];
          if(group){
            rsGroupValidator.formValidate(formCtrl[prop], prop, group, formCtrl);
          }
          else if( formCtrl[prop]){
            rsValidator.validate(formCtrl[prop], prop, formCtrl[prop].$viewValue, formCtrl);
          }
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
        (/^([a-zA-Z0-9_\.\-\+!\$%&'*\/=?\^`{|}~#]+)@([\da-zA-Z\.\-]+)\.([a-zA-Z\.]{2,6})$/).test(value);
      }
    };
  });
