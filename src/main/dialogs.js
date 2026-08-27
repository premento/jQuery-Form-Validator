/**
 * Utility methods used for displaying error messages (attached to $.formUtils)
 */
(function ($) {

  'use strict';

  var sanitizeHTML = function(str) {
    return $('<div></div>').text(str).html();
  };

  // sanitizeHTML escapes & < >, but an id can legitimately reach us from a
  // page author, so quotes have to go too before it lands in an attribute.
  var sanitizeAttr = function(str) {
    return sanitizeHTML(str).replace(/"/g, '&quot;');
  };

  /**
   * Substitute {placeholders} in a template.
   *
   * One pass, so text substituted in for one key is never rescanned for
   * another -- a validation message containing something like {fields} is
   * inserted literally rather than treated as a placeholder.
   *
   * @param {String} template
   * @param {Object} params
   * @return {String}
   */
  var renderTemplate = function(template, params) {
    return String(template).replace(/\{(\w+)\}/g, function(match, key) {
      return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
    });
  };

  var dialogs = {

    resolveErrorMessage: function($elem, validator, validatorName, conf, language) {
      var errorMsgAttr = conf.validationErrorMsgAttribute + '-' + validatorName.replace('validate_', ''),
        validationErrorMsg = $elem.attr(errorMsgAttr);

      if (!validationErrorMsg) {
        validationErrorMsg = $elem.attr(conf.validationErrorMsgAttribute);
        if (!validationErrorMsg) {
          if (typeof validator.errorMessageKey !== 'function') {
            validationErrorMsg = language[validator.errorMessageKey];
          }
          else {
            validationErrorMsg = language[validator.errorMessageKey(conf)];
          }
          if (!validationErrorMsg) {
            validationErrorMsg = validator.errorMessage;
          }
        }
      }
      return validationErrorMsg;
    },
    getParentContainer: function ($elem, conf) {
      if ($elem.valAttr('error-msg-container')) {
        return $($elem.valAttr('error-msg-container'));
      } else {
        var $parent = $elem.parent(),
          $inputGroup;
        if($elem.attr('type') === 'checkbox' && $elem.closest('.checkbox').length) {
          $parent = $elem.closest('.checkbox').parent();
        } else if($elem.attr('type') === 'radio' && $elem.closest('.radio').length) {
          $parent = $elem.closest('.radio').parent();
        }
        $inputGroup = $parent.closest('.input-group');
        if($inputGroup.length) {
          // Bootstrap 4 and 5 reveal a message with `.is-invalid ~ .invalid-feedback`,
          // so it has to stay inside the group to remain a sibling of the control.
          // Hoisting it out -- which is what Bootstrap 3 wants -- would leave the
          // message permanently display:none, and the field flagged with no reason
          // shown. Bootstrap 3 has no such rule, so it keeps the old placement.
          if ($.formUtils.usesBootstrapValidationApi(conf)) {
            return $inputGroup;
          }
          $parent = $inputGroup.parent();
        }
        return $parent;
      }
    },
    applyInputErrorStyling: function ($input, conf) {
      $input
        .addClass(conf.errorElementClass)
        .removeClass(conf.successElementClass);

      $.formUtils.a11y.markInvalid($input);

      this.getParentContainer($input, conf)
        .addClass(conf.inputParentClassOnError)
        .removeClass(conf.inputParentClassOnSuccess);

      if (conf.borderColorOnError !== '') {
        $input.css('border-color', conf.borderColorOnError);
      }
    },
    applyInputSuccessStyling: function($input, conf) {
      $input.addClass(conf.successElementClass);
      $.formUtils.a11y.clearError($input);
      this.getParentContainer($input, conf)
        .addClass(conf.inputParentClassOnSuccess);
    },
    removeInputStylingAndMessage: function($input, conf) {

      // Reset input css
      $input
        .removeClass(conf.successElementClass)
        .removeClass(conf.errorElementClass)
        .css('border-color', '');

      $.formUtils.a11y.clearError($input);

      var $parentContainer = dialogs.getParentContainer($input, conf);

      // Reset parent css
      $parentContainer
        .removeClass(conf.inputParentClassOnError)
        .removeClass(conf.inputParentClassOnSuccess);

      // Remove possible error message
      if (typeof conf.inlineErrorMessageCallback === 'function') {
        var $errorMessage = conf.inlineErrorMessageCallback($input, false, conf);
        if ($errorMessage) {
          $errorMessage.html('');
        }
      } else {
        $parentContainer
          .find('.' + conf.errorMessageClass)
          .remove();
        // Added alongside the message, so it goes away with it.
        if ($parentContainer.hasClass('input-group')) {
          $parentContainer.removeClass('has-validation');
        }
      }

    },
    removeAllMessagesAndStyling: function($form, conf) {

      // Remove error messages in top of form
      if (typeof conf.submitErrorMessageCallback === 'function') {
        var $errorMessagesInTopOfForm = conf.submitErrorMessageCallback($form, false, conf);
        if ($errorMessagesInTopOfForm) {
          $errorMessagesInTopOfForm.html('');
        }
      } else {
        $form.find('.' + conf.errorMessageClass + '.alert').remove();
      }

      // Remove input css/messages
      $form.find('.' + conf.errorElementClass + ',.' + conf.successElementClass).each(function() {
        dialogs.removeInputStylingAndMessage($(this), conf);
      });
    },
    setInlineMessage: function ($input, errorMsg, conf) {

      this.applyInputErrorStyling($input, conf);

      var custom = document.getElementById($input.attr('name') + '_err_msg'),
        $messageContainer = false,
        setErrorMessage = function ($elem) {
          $.formUtils.$win.trigger('validationErrorDisplay', [$input, $elem]);
          $elem.html(sanitizeHTML(errorMsg));
          $.formUtils.a11y.describeError($input, $elem);
        },
        addErrorToMessageContainer = function() {
          var $found = false;
          $messageContainer.find('.' + conf.errorMessageClass).each(function () {
            if (this.inputReferer === $input[0]) {
              $found = $(this);
              return false;
            }
          });
          if ($found) {
            if (!errorMsg) {
              $found.remove();
            } else {
              setErrorMessage($found);
            }
          } else if(errorMsg !== '') {
            $message = $('<div class="' + conf.errorMessageClass + ' alert"></div>');
            setErrorMessage($message);
            $message[0].inputReferer = $input[0];
            $messageContainer.prepend($message);
          }
        },
        $message;

      if (custom) {
        // Todo: remove in 3.0
        $.formUtils.warn('Using deprecated element reference ' + custom.id);
        $messageContainer = $(custom);
        addErrorToMessageContainer();
      } else if (typeof conf.inlineErrorMessageCallback === 'function') {
        $messageContainer = conf.inlineErrorMessageCallback($input, errorMsg, conf);
        if (!$messageContainer) {
          // Error display taken care of by inlineErrorMessageCallback
          return;
        }
        addErrorToMessageContainer();
      } else {
        var $parent = this.getParentContainer($input, conf),
          inlineClass = conf.inlineErrorMessageClass || '';
        $message = $parent.find('.' + conf.errorMessageClass + (inlineClass ? '.' + inlineClass : ''));
        if ($message.length === 0) {
          $message = $('<span></span>').addClass(conf.errorMessageClass);
          if (inlineClass) {
            $message.addClass(inlineClass);
          }
          $message.appendTo($parent);
          // Bootstrap 5 needs to know the group has a validation message, or the
          // control keeps a square right-hand edge where the message now sits.
          if ($parent.hasClass('input-group')) {
            $parent.addClass('has-validation');
          }
        }
        setErrorMessage($message);
      }
    },
    setMessageInTopOfForm: function ($form, errorMessages, conf, lang, errorItems) {
      // Merge over the defaults so a caller can override one key without
      // having to restate the rest.
      var template = $.extend({},
            $.formUtils.defaultConfig().errorMessageTemplate,
            conf.errorMessageTemplate || {}),
          $container = false,
          fields = '',
          view;

      if (typeof conf.submitErrorMessageCallback === 'function') {
        $container = conf.submitErrorMessageCallback($form, errorMessages, conf);
        if (!$container) {
          // message display taken care of by callback
          return;
        }
      }

      if (errorItems && errorItems.length) {
        $.each(errorItems, function (i, item) {
          fields += renderTemplate(template.field, {
            id: sanitizeAttr($.formUtils.a11y.ensureInputId(item.$input)),
            msg: sanitizeHTML(item.message)
          });
        });
      } else {
        // Nothing to link to, so use the template that does not try.
        $.each(errorMessages, function (i, msg) {
          fields += renderTemplate(template.fieldNoLink, {msg: sanitizeHTML(msg)});
        });
      }

      view = renderTemplate(template.container, {
        errorMessageClass: sanitizeAttr(conf.errorMessageClass),
        messages: renderTemplate(template.messages, {
          errorTitle: sanitizeHTML(lang.errorTitle),
          fields: fields
        })
      });

      if ($container) {
        $container.html(view);
      } else {
        $form.children().eq(0).before($(view));
      }
    }
  };

  $.formUtils = $.extend($.formUtils || {}, {
    dialogs: dialogs
  });

})(jQuery);
