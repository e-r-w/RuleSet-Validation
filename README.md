# Angular RuleSet Validation

**Super light-weight Angular form validation!**

**WARNING**: This module is intended as a sort of monkey patch to get around Angular 1.2.x's lack of native form validation on blur.

You should use a later version of Angular where possible and use `ng-model-options="{ updateOn: 'blur' }"`, or try ui.utils' validate & event binder.

In the case that neither of these options suit you, go nuts with RuleSet Validation.

## The skinny of it

RuleSet validation is driven by native Angular form validation. $dirty/$pristine still apply, form.$valid still applies, but the validation functions are handled by RuleSet Validation using what you feed into the `rsStore`.

## Why wrap native validation?

For two reasons:

  - As mentioned before, Angular 1.2.x's `ngModel` will update on input/keypress/whatever, with no native options to change that. This means that validation runs with every key press the user entered, and it's terrible to receive a validation message before you've even finished typing in the form field. RuleSet Validation runs only on blur (but I would consider making that configurable if wanted).

  - Angular validation does not correlate specific errors to error messages, meaning you have to do something like this:

  ```html
  <div data-ng-show="myForm.myEmail.$error.required">
      Please enter an email
  </div>
  <div data-ng-show="myForm.myEmail.$error.email">
      Please enter a valid email address
  </div>
  <!-- And so on... -->
  ```

  And pollute your view with several error messages per validated form input. RuleSet Validation will append a `message` string to your `formField.$error`
  object so you can simply use:

  ```html
    <div data-ng-show="myForm.myEmail.$error.message">
      {{ myForm.myEmail.$error.message }}
    </div>
  ```

  Whereby the `message` string will be remove from the `formField.$error` object once the field is valid. This message is defined in your rule set and attached to the validation function that belongs to the message.
  
## But how do I use RuleSet Validation?
  
  Why you simply have to register a rule set and use the `data-rule-set-validate` directive on your form inputs! RuleSet Validation will use the `name` attribute
  on the form input tag to find validation rules you've registered as well as setting the native form validation state.
  
  Oh and don't forget to include the module in your app:
  
  ```javascript
  angular.module('myApp', ['ruleSetValidation']);
  ```
  
### Configuring rule sets
  
  Rule sets can be configured by injecting the `rsStore` object in your app.run/controller/service and using `rsStore.addRule(ruleSet)` to add the rule set to the store.
  
  Rule sets must be objects that follow either of these patterns:
  
  ```javascript
  {
    myEmail: {
      "you need to enter an email address": function(value) {
        return value !== '';
      },
      "your email is blacklisted": function(value){
        return ['bademail@baddomain.com'].indexOf(value);
      }
    }
  }
  ```
  or
  
  ```javascript
  {
    myForm: {
      myEmail: {
        "you need to enter an email address": function(value) {
          return value !== '';
        },
        "your email is blacklisted": function(value){
          return ['bademail@baddomain.com'].indexOf(value);
        }
      }
    }
  }
  ```
  where `myForm` is the value of the `data-rule-set-validate` attribute. This should be the name of your form, but I'm not going to stop you.
  
  If you fail to adhere to these object standards, you will most likely see run-time errors. I'm not going to baby-proof a monkey patch, deal with it.
  
  The rule storage will also not handle duplicates. If you register a rule already defined, the new one will take it's place.

### Group rule sets

  Group rule sets are defined similar to regular rule sets, except the validation function takes in an object that will feature the group items:
  
  ```javascript
  {
    myForm: {
      myPassword: {
        "Please enter password": rsRules.required,
      },
      myConfirmPassword: {
        "Please confirm password": rsRules.required,
      }
      myPasswordGroup: {
        "Passwords must match": function(values) {
          return values.myPassword === values.myConfirmPassword;
        }
      }
    }
  }
  ```
  
  ```html
  <input 
    name="myPassword"
    data-ng-model="myPassword"
    data-rule-set-validate="myForm"
    data-rule-set-validate-group="myPasswordGroup"
    />
  <input 
    name="myConfirmPassword"
    data-ng-model="myConfirmPassword"
    data-rule-set-validate="myForm"
    data-rule-set-validate-group="myPasswordGroup"
    />
  <div data-ng-show="myForm.myPasswordGroup.$error.message">
    {{ myForm.myPasswordGroup.$error.message }}
  </div>
  ```
  
  Group validation will be called whenever a blur event is fired on any of the inputs marked with `data-rule-set-validate-group`, so make sure you check for empty strings or undefined where relevant! Rules will be determined by the value of `data-rule-set-validate-group`. Inputs that belong to multiple groups should comma seperate their group names (without spaces), like so:
  
  ```html
  <input 
    name="myField"
    data-ng-model="myField"
    data-rule-set-validate="myForm"
    data-rule-set-validate-group="myGroup,myOtherGroup"
    />
  
  ```
  
### Asynchronous Validation
  Asynchronous validation utilizes `$q.defer()`. RuleSet validation will give your rules the defer object and your rules need to return its `promise`. RuleSet Validation expects you to `resolve` or `reject` with a plain boolean representing the validity. Resolving or rejecting does not change the validation outcome; for instance you can use `deferred.reject(true)`, and the input will be marked as valid, or `deferred.resolve(false)` and the input will be marked as invalid.
  
  To use asynchronous validation, label your rule set object with `':async'`:
  
```javascript
  {
    myForm: {
      'myAddress:async': {
        "Invalid address": function(value, deferred){
          $http.post(
            //... post url/data
          ).success(function(){
            // a success code represents valid input, so we resolve with 'true'
            deferred.resolve(true);
          }).error(function(){
            // a failure code represents invalid input, so we reject with 'false'
            deferred.reject(false);
          });
          return deferred.promise;
        },
      }
    }
  }
  ```
  
  You can even mix group & asynchronous validation. Just tag your group rule with `':async'`!.
  
### Form validation
  
  If you need to validate the whole form using the rule set in js, simply call `rsFormValidator.validate(formCtrl, formCtrlName)`, where `formCtrl` is the form controller (i.e `scope.myForm`) and `formCtrlName` is the name you've given to the form's rule set (i.e `'myForm'`). RuleSet Validation will simply loop through all the rules you've associated with that form and call the validation.
  
## Caveats

 - **DO NOT** mix native angular form validation with RuleSet Validation. RuleSet Validation **DOES NOT** use `ctrl.$parsers` and as such will not run with default angular validation.
 There are some default rules that you can use that will cover the basics that angular normally provides. Just inject `rsRules` when you define your rule set:
 
 ```javascript
 // ...
 var myRules = {
     myEmail: {
       "Please enter an email address": rsRules.required,
       "Please enter a valid email address": rsRules.email,
       "your email is blacklisted": function(value){
          return ['bademail@baddomain.com'].indexOf(value);
        }
     }
 }
 // ...
 ```
 Alternatively, you can use `rsStore.rsRules` to access the default rules provided. Check the src for more rules.