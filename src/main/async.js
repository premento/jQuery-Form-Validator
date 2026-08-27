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

  var DEFAULT_DEBOUNCE = 500;

  function AsyncValidation($form, $input) {
    this.$form = $form;
    this.$input = $input;
    this.lastEventContext = null;
    this._generation = 0;
    this._debounceId = null;
    this._boundReset = this.reset.bind(this);
    $input.on('change paste', this._boundReset);
    this.reset();
  }

  /**
   * How long to wait before actually calling out, in milliseconds.
   * Set data-validation-debounce="0" on the input to call out immediately.
   *
   * @return {Number}
   */
  AsyncValidation.prototype.debounceDelay = function() {
    var configured = this.$input.valAttr('debounce');
    if (configured === undefined || configured === '') {
      return DEFAULT_DEBOUNCE;
    }
    var parsed = parseInt(configured, 10);
    return isNaN(parsed) || parsed < 0 ? DEFAULT_DEBOUNCE : parsed;
  };

  AsyncValidation.prototype.reset = function() {
    // Hand back a halt this instance is still holding. HaltManager counts
    // halts per form, so silently dropping the flag leaves the counter above
    // zero and the form can never be submitted again. Editing the field
    // between a check being scheduled and it resolving is the ordinary way to
    // reach this.
    if (this.haltedFormValidation) {
      this.haltedFormValidation = false;
      HaltManager.unHaltValidation(this.$form);
    }

    if (this.isRunning) {
      // The in-flight state is being abandoned, so drop its markers too.
      this.$input.removeAttr('aria-busy').removeClass('async-validation');
      this.$form.removeClass('async-validation');
    }

    this.hasRun = false;
    this.isRunning = false;
    this.result = undefined;
    this._generation++;

    // A call scheduled against the previous value must not go out. The
    // generation check would discard its result anyway, but there is no point
    // making the request at all.
    if (this._debounceId !== null) {
      clearTimeout(this._debounceId);
      this._debounceId = null;
    }
  };

  AsyncValidation.prototype.run = function(eventContext, callback) {
    // Never fire a network round trip while the user is still typing.
    if (eventContext === 'input' || eventContext === 'keyup') {
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

      // aria-busy rather than disabled. Disabling the field steals focus,
      // takes it out of the tab order and hides it from assistive technology,
      // and a disabled control is omitted from form submission entirely.
      this.$input
        .attr('aria-busy', 'true')
        .addClass('async-validation');
      this.$form.addClass('async-validation');

      this.schedule(eventContext, callback);

      return null;
    }
  };

  /**
   * Wait out the debounce, then call out. The form stays halted for the whole
   * window, so nothing can be submitted past a check that has not run yet.
   *
   * @param {String} eventContext
   * @param {Function} callback
   */
  AsyncValidation.prototype.schedule = function(eventContext, callback) {
    var self = this,
      gen = this._generation,
      // Submitting is a commitment, not a keystroke -- make the user wait for
      // the request, never for the debounce on top of it.
      delay = eventContext === 'submit' ? 0 : this.debounceDelay();

    if (this._debounceId !== null) {
      clearTimeout(this._debounceId);
      this._debounceId = null;
    }

    if (!delay) {
      this.invoke(gen, callback);
      return;
    }

    this._debounceId = setTimeout(function() {
      self._debounceId = null;
      if (self._generation === gen) {
        self.invoke(gen, callback);
      }
    }, delay);
  };

  /**
   * Hand control to the validator and start the timeout clock, which only
   * begins once the request is genuinely on its way.
   *
   * @param {Number} gen
   * @param {Function} callback
   */
  AsyncValidation.prototype.invoke = function(gen, callback) {
    var self = this,
      timeoutId = setTimeout(function() {
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
  };

  AsyncValidation.prototype.done = function(result) {
    this.result = result;
    this.hasRun = true;
    this.isRunning = false;
    this.$input
      .removeAttr('aria-busy')
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
