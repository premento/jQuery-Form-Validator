/**
 */
(function ($, window, undefined) {

  // Polyfills for jQuery 4.0.0 support to maintain backwards compatibility
  if (!$.trim) {
    $.trim = function (val) {
      return val === null || val === undefined ? '' : String(val).trim();
    };
  }
  if (!$.isArray) {
    $.isArray = Array.isArray;
  }
  if (!$.isNumeric) {
    $.isNumeric = function (val) {
      if (Array.isArray(val) || val === true || val === false || val === null || val === undefined) {
        return false;
      }
      var s = String(val).trim();
      return s.length > 0 && !isNaN(s - parseFloat(s));
    };
  }
  if (!$.parseJSON) {
    $.parseJSON = JSON.parse;
  }

  var disableFormSubmit = function () {
      return false;
    },
    HaltManager = {
      _haltedForms: {},
      haltValidation: function($form) {
        var formId = $form.get(0);
        if (!this._haltedForms[formId]) {
          this._haltedForms[formId] = 0;
        }
        this._haltedForms[formId]++;
        $.formUtils.haltValidation = true;
        $form
          .unbind('submit', disableFormSubmit)
          .bind('submit', disableFormSubmit)
          .find('*[type="submit"]')
            .addClass('disabled')
            .attr('disabled', 'disabled');
      },
      unHaltValidation: function($form) {
        var formId = $form.get(0);
        if (this._haltedForms[formId]) {
          this._haltedForms[formId]--;
          if (this._haltedForms[formId] <= 0) {
            delete this._haltedForms[formId];
            $.formUtils.haltValidation = Object.keys(this._haltedForms).length > 0;
            $form
              .unbind('submit', disableFormSubmit)
              .find('*[type="submit"]')
                .removeClass('disabled')
                .removeAttr('disabled');
          }
        }
      }
    };

  function AsyncValidation($form, $input) {
    this.$form = $form;
    this.$input = $input;
    this.lastEventContext = null;
    this._generation = 0;
    this._boundReset = this.reset.bind(this);
    $input.on('change paste', this._boundReset);
    this.reset();
  }

  AsyncValidation.prototype.reset = function() {
    this.haltedFormValidation = false;
    this.hasRun = false;
    this.isRunning = false;
    this.result = undefined;
    this._generation++;
  };

  AsyncValidation.prototype.run = function(eventContext, callback) {
    if (eventContext === 'keyup') {
      return null;
    } else if (this.isRunning) {
      this.lastEventContext = eventContext;
      if (!this.haltedFormValidation) {
        HaltManager.haltValidation(this.$form);
        this.haltedFormValidation = true;
      }
      return null; // Waiting for result
    } else if(this.hasRun) {
      return this.result;
    } else {
      this.lastEventContext = eventContext;
      HaltManager.haltValidation(this.$form);
      this.haltedFormValidation = true;
      this.isRunning = true;
      this.$input
        .attr('disabled', 'disabled')
        .addClass('async-validation');
      this.$form.addClass('async-validation');

      var gen = this._generation;
      var self = this;

      var timeoutId = setTimeout(function() {
        if (self.isRunning && self._generation === gen) {
          self.done(null);
          $.formUtils.warn('Async validation timed out for ' + self.$input.attr('name'));
        }
      }, 30000);

      callback(function(result) {
        clearTimeout(timeoutId);
        if (self._generation === gen) {
          self.done(result);
        }
      });

      return null;
    }
  };

  AsyncValidation.prototype.done = function(result) {
    this.result = result;
    this.hasRun = true;
    this.isRunning = false;
    this.$input
      .removeAttr('disabled')
      .removeClass('async-validation');
    this.$form.removeClass('async-validation');
    if (this.haltedFormValidation) {
      this.haltedFormValidation = false;
      HaltManager.unHaltValidation(this.$form);
      if (this.lastEventContext === 'submit') {
        this.$form.trigger('submit');
      } else {
        this.$input.trigger('validation.revalidate');
      }
    }
  };

  AsyncValidation.loadInstance = function(validatorName, $input, $form) {
    // Return async validator attached to this input element
    // or create a new async validator and attach it to the input
    var asyncValidation,
      input = $input.get(0);

    if (!input.asyncValidators) {
      input.asyncValidators = {};
    }

    if (input.asyncValidators[validatorName]) {
      asyncValidation = input.asyncValidators[validatorName];
    } else {
      asyncValidation = new AsyncValidation($form, $input);
      input.asyncValidators[validatorName] = asyncValidation;
    }

    return asyncValidation;
  };

  $.formUtils = $.extend($.formUtils || {}, {

    /**
     * @deprecated
     * @param validatorName
     * @param $input
     * @param $form
     */
    asyncValidation: function(validatorName, $input, $form) {
      // @todo: Remove when moving up to version 3.0
      this.warn('Use of deprecated function $.formUtils.asyncValidation, use $.formUtils.addAsyncValidator() instead');
      return AsyncValidation.loadInstance(validatorName, $input, $form);
    },

    /**
     * @param {Object} asyncValidator
     */
    addAsyncValidator: function (asyncValidator) {
      var validator = $.extend({}, asyncValidator),
        originalValidatorFunc = validator.validatorFunction;
      validator.async = true;
      validator.validatorFunction = function (value, $el, config, language, $form, eventContext) {
        var asyncValidation = AsyncValidation.loadInstance(this.name, $el, $form);
        return asyncValidation.run(eventContext, function(done) {
          originalValidatorFunc.apply(validator, [
            done, value, $el, config, language, $form, eventContext
          ]);
        });
      };
      this.addValidator(validator);
    }
  });

  // Tag elements having async validators
  $(window).bind('validatorsLoaded formValidationSetup', function (evt, $form) {
    if (!$form) {
      $form = $('form');
    }
    $form.find('[data-validation]').each(function () {
      var $input = $(this);
      $input.valAttr('async', false);
      $.each($.split($input.attr('data-validation')), function (i, validatorName) {
        var validator = $.formUtils.validators && $.formUtils.validators['validate_'+validatorName];
        if (validator && validator.async) {
          $input.valAttr('async', 'yes');
        }
      });
    });
  });

})(jQuery, window);
