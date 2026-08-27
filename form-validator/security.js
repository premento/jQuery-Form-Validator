(function (root, factory) {
  if (root === undefined && window !== undefined) root = window;
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["jquery"], function (a0) {
      return (factory(a0));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("jquery"));
  } else {
    factory(root["jQuery"]);
  }
}(this, function (jQuery) {

/**
 * jQuery Form Validator Module: Security
 * ------------------------------------------
 * Created by Victor Jonsson <http://victorjonsson.se>
 *
 * This module adds validators typically used in registration forms.
 * This module adds the following validators:
 *  - spamcheck
 *  - confirmation
 *  - strength
 *  - backend
 *  - credit card
 *  - cvv
 *
 * @website http://formvalidator.net/#security-validators
 * @license MIT
 */
(function ($, window) {

  'use strict';

  $.formUtils.registerLoadedModule('security');

  /**
   * SHA-1 of a string, uppercase hex.
   *
   * SHA-1 is not a security choice here -- it is the digest the Have I Been
   * Pwned range API is keyed on.
   *
   * @param {String} value
   * @return {Promise}
   */
  var sha1Hex = function (value) {
      var bytes = new window.TextEncoder().encode(value);
      return window.crypto.subtle.digest('SHA-1', bytes).then(function (buffer) {
        var view = new window.Uint8Array(buffer),
          out = [],
          i;
        for (i = 0; i < view.length; i++) {
          out.push(('0' + view[i].toString(16)).slice(-2));
        }
        return out.join('').toUpperCase();
      });
    },

    canScreenPasswords = function () {
      // crypto.subtle is only exposed in a secure context.
      return !!(window.crypto && window.crypto.subtle &&
        window.TextEncoder && window.fetch);
    };

  /**
   * Reject passwords known to have appeared in a breach.
   *
   * OPT IN, and it talks to the network. Add data-validation="breached" to a
   * field and every check sends an HTTPS request to the Have I Been Pwned
   * range API.
   *
   * The password itself never leaves the browser. Only the first five hex
   * characters of its SHA-1 are sent; the service answers with every suffix
   * sharing that prefix, and the match is made locally. This is the
   * k-anonymity model the API is designed around.
   *
   * Point data-validation-breach-url elsewhere to use your own endpoint.
   */
  $.formUtils.addAsyncValidator({
    name: 'breached',
    validatorFunction: function (done, val, $el) {
      var endpoint = $el.valAttr('breach-url') || 'https://api.pwnedpasswords.com/range/';

      if (!val) {
        done(true);
        return;
      }

      if (!canScreenPasswords()) {
        $.formUtils.warn(
          'Breached password screening needs crypto.subtle and fetch, which are ' +
          'only available in a secure context (https, or localhost). Skipping ' +
          'the check.'
        );
        done(true);
        return;
      }

      sha1Hex(val)
        .then(function (hash) {
          var prefix = hash.substring(0, 5),
            suffix = hash.substring(5);

          return window.fetch(endpoint + prefix, {
            method: 'GET',
            // Nothing about this request identifies the user; keep it that way.
            credentials: 'omit',
            cache: 'no-store'
          }).then(function (response) {
            if (!response.ok) {
              throw new Error('Breach lookup returned ' + response.status);
            }
            return response.text();
          }).then(function (body) {
            var breached = false;
            $.each(body.split('\n'), function (i, line) {
              if (line.split(':')[0].trim().toUpperCase() === suffix) {
                breached = true;
                return false;
              }
            });
            done(!breached);
          });
        })
        .catch(function (err) {
          // Fail open. An outage of the screening service is not a reason to
          // lock someone out of a form, and the other password rules still
          // apply. The failure is surfaced rather than swallowed silently.
          $.formUtils.warn('Breached password check unavailable (' +
            (err && err.message ? err.message : 'unknown error') +
            '); allowing the value.');
          done(true);
        });
    },
    errorMessage: 'This password has appeared in a known data breach. Please choose a different one.',
    errorMessageKey: 'badBreachedPassword'
  });

  /*
   * NIST SP 800-63B rev 4 asks that at least 64 characters be accepted and
   * that nothing be silently truncated. Warn rather than override: the author
   * may be working to a backend limit they do not control.
   */
  $.formUtils.$win.bind('validatorsLoaded formValidationSetup', function (evt, $form) {
    if (!$form) {
      $form = $('form');
    }
    $form.find('input[type="password"][maxlength]').each(function () {
      var $input = $(this),
        max = parseInt($input.attr('maxlength'), 10);
      if (!isNaN(max) && max < 64) {
        $.formUtils.warn('Password field "' + ($input.attr('name') || '(unnamed)') +
          '" caps input at ' + max + ' characters. NIST SP 800-63B asks that at ' +
          'least 64 be accepted, and that longer values are not truncated.');
      }
    });
  });


  /*
   * Simple spam check
   */
  $.formUtils.addValidator({
    name: 'spamcheck',
    validatorFunction: function (val, $el) {
      var attr = $el.valAttr('captcha');
      return attr === val;
    },
    errorMessage: '',
    errorMessageKey: 'badSecurityAnswer'
  });

  /*
   * Validate confirmation (tests that two inputs are identical; usually used for
   * passwords)
   */
  $.formUtils.addValidator({
    name: 'confirmation',
    validatorFunction: function (value, $el, config, language, $form) {
      var password,
        passwordInputName = $el.valAttr('confirm') ||
          ($el.attr('name') + '_confirmation'),
        $passwordInput = $form.find('[name="' + passwordInputName + '"]');
      if (!$passwordInput.length) {
        $.formUtils.warn('Password confirmation validator: could not find an input ' +
          'with name "' + passwordInputName + '"', true);
        return false;
      }

      password = $passwordInput.val();
      if (config.validateOnBlur && !$passwordInput[0].hasValidationCallback) {
        $passwordInput[0].hasValidationCallback = true;
        var keyUpCallback = function () {
          $el.validate();
        };
        $passwordInput.on('keyup', keyUpCallback);
        $form.one('formValidationSetup', function () {
          $passwordInput[0].hasValidationCallback = false;
          $passwordInput.off('keyup', keyUpCallback);
        });
      }

      return value === password;
    },
    errorMessage: '',
    errorMessageKey: 'notConfirmed'
  });

  var creditCards = {
      'amex': [15, 15],
      'diners_club': [14, 14],
      'cjb': [16, 16],
      'laser': [16, 19],
      'visa': [16, 16],
      'mastercard': [16, 16],
      'maestro': [12, 19],
      'discover': [16, 16]
    };


  /**
   * Where the card type is kept while a form is being validated.
   *
   * The form, when there is one, so that the credit card field and the cvv
   * field can see the same value without leaking it to other forms on the
   * page. Falls back to the element for a detached input.
   *
   * @param {jQuery} $el
   * @param {jQuery} [$form]
   * @return {jQuery}
   */
  var cardTypeHolder = function ($el, $form) {
    return $form && $form.length ? $form : $el;
  };

  /*
   * Credit card
   */
  $.formUtils.addValidator({
    name: 'creditcard',
    validatorFunction: function (value, $el, conf, language, $form) {
      var allowing = $.split($el.valAttr('allowing') || ''),
        allowsAmex = $.inArray('amex', allowing) > -1,
        checkOnlyAmex = allowsAmex && allowing.length === 1;

      // Hand the card type to the cvv validator, which needs it to know how
      // many digits to expect. It goes on the form rather than on this input:
      // the cvv validator reads from its own element and so never saw it here,
      // and module scope leaked the value between forms on the same page.
      cardTypeHolder($el, $form).data('jfvCardTypes', {
        allowsAmex: allowsAmex,
        checkOnlyAmex: checkOnlyAmex
      });

      // Correct length
      if (allowing.length > 0) {
        var hasValidLength = false;
        $.each(allowing, function (i, cardName) {
          if (cardName in creditCards) {
            if (value.length >= creditCards[cardName][0] && value.length <= creditCards[cardName][1]) {
              hasValidLength = true;
              return false;
            }
          } else {
            $.formUtils.warn('Use of unknown credit card "' + cardName + '"', true);
          }
        });

        if (!hasValidLength) {
          return false;
        }
      } else {
        // When no allowing is specified, validate against common card lengths (13-19 digits)
        if (value.length < 13 || value.length > 19) {
          return false;
        }
      }

      // only numbers
      if (value.replace(new RegExp('[0-9]', 'g'), '') !== '') {
        return false;
      }

      // http://en.wikipedia.org/wiki/Luhn_algorithm
      // http://www.brainjar.com/js/validation/default2.asp
      var checkSum = 0;
      $.each(value.split('').reverse(), function (i, digit) {
        digit = parseInt(digit, 10);
        if (i % 2 === 0) {
          checkSum += digit;
        } else {
          digit *= 2;
          if (digit < 10) {
            checkSum += digit;
          } else {
            checkSum += digit - 9;
          }
        }
      });
      return checkSum % 10 === 0;
    },
    errorMessage: '',
    errorMessageKey: 'badCreditCard'
  });

  /*
   * Credit card number
   */
  $.formUtils.addValidator({
    name: 'cvv',
    validatorFunction: function (val, $el, conf, language, $form) {
      if (val.replace(/[0-9]/g, '') === '') {
        val = val + '';
        // The per-element values are still honoured first, so anything that
        // set them directly keeps working.
        var cardTypes = cardTypeHolder($el, $form).data('jfvCardTypes') || {},
          checkOnlyAmex = $el.data('checkOnlyAmex') || cardTypes.checkOnlyAmex || false,
          allowsAmex = $el.data('allowsAmex') || cardTypes.allowsAmex || false;
        if (checkOnlyAmex) {
          return val.length === 4;
        } else if (allowsAmex) {
          return val.length === 3 || val.length === 4;
        } else {
          return val.length === 3;
        }
      }
      return false;
    },
    errorMessage: '',
    errorMessageKey: 'badCVV'
  });

  /*
   * Validate password strength
   */
  $.formUtils.addValidator({
    name: 'strength',
    validatorFunction: function (val, $el) {
      var requiredStrength = $el.valAttr('strength') || 2;
      if (requiredStrength && requiredStrength > 3) {
        requiredStrength = 3;
      }

      return $.formUtils.validators.validate_strength.calculatePasswordStrength(val) >= requiredStrength;
    },
    errorMessage: '',
    errorMessageKey: 'badStrength',

    /**
     * Score a password from 0 (unusable) to 3 (strong).
     *
     * Rewritten in 3.0 around NIST SP 800-63B rev 4. The previous scoring was
     * composition driven -- points for mixed case, for digits, for symbols --
     * which rev 4 explicitly retired, because it rewards short predictable
     * passwords over long ones. Under the old scoring "P@ss1!" rated strong
     * and a sixteen character lowercase password did not.
     *
     * Length is now the only thing that earns score, and only length the
     * attacker actually has to guess: runs and sequences are discounted,
     * because once the pattern is known the rest of it comes for free.
     *
     * @param {String} password
     * @return {Number} 0-3
     */
    calculatePasswordStrength: function (password) {
      var value = String(password === undefined || password === null ? '' : password),
        validator = $.formUtils.validators.validate_strength,
        effective;

      if (!value.length) {
        return 0;
      }

      // Length does not rescue a password that is already in every word list;
      // "password123456" is still guessed early.
      if (validator.isCommonPassword(value)) {
        return 0;
      }

      effective = validator.effectiveLength(value);

      // Thresholds follow rev 4: 8 is the floor for an account carrying a
      // second factor, 15 the floor for one that does not.
      if (effective < 8) {
        return 0;
      }
      if (effective < 12) {
        return 1;
      }
      if (effective < 15) {
        return 2;
      }
      return 3;
    },

    /**
     * Length discounted for predictability.
     *
     * A character that continues an established run ("aaaa") or a run of
     * consecutive code points ("abcd", "9876") is most of the way to free for
     * an attacker, so from the third character of a pattern onward it barely
     * counts. The first two still carry information.
     *
     * @param {String} value
     * @return {Number}
     */
    effectiveLength: function (value) {
      var total = 0,
        runLength = 1,
        prevDelta = null,
        delta,
        i;

      for (i = 0; i < value.length; i++) {
        if (i === 0) {
          total += 1;
          continue;
        }

        delta = value.charCodeAt(i) - value.charCodeAt(i - 1);

        if (delta === prevDelta && (delta === 0 || delta === 1 || delta === -1)) {
          runLength++;
        } else {
          runLength = 1;
        }

        total += runLength >= 3 ? 0.25 : 1;
        prevDelta = delta;
      }

      return total;
    },

    /**
     * Whether the value is one of the passwords that dominate every breach
     * corpus, ignoring case and any trailing digits or punctuation.
     *
     * The list is deliberately short. It is a floor, not coverage -- real
     * coverage comes from the "breached" validator, which checks the value
     * against Have I Been Pwned.
     *
     * @param {String} value
     * @return {Boolean}
     */
    isCommonPassword: function (value) {
      var list = $.formUtils.validators.validate_strength.commonPasswords,
        lower = value.toLowerCase(),
        stripped = lower.replace(/[0-9!@#$%^&*_.\-]+$/, '');

      return $.inArray(lower, list) > -1 ||
        (stripped.length > 2 && $.inArray(stripped, list) > -1);
    },

    commonPasswords: [
      '123456', 'password', '12345678', 'qwerty', '123456789', '12345',
      '1234', '111111', '1234567', 'dragon', '123123', 'baseball', 'abc123',
      'football', 'monkey', 'letmein', 'shadow', 'master', '666666',
      'qwertyuiop', '123321', 'mustang', '1234567890', 'michael', '654321',
      'superman', '1qaz2wsx', '7777777', '121212', '000000', 'qazwsx',
      '123qwe', 'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm',
      'asdfgh', 'hunter', 'buster', 'soccer', 'harley', 'batman', 'andrew',
      'tigger', 'sunshine', 'iloveyou', 'charlie', 'robert', 'thomas',
      'hockey', 'ranger', 'daniel', 'starwars', 'klaster', '112233',
      'george', 'computer', 'michelle', 'jessica', 'pepper', 'zxcvbn',
      '555555', '11111111', '131313', 'freedom', '777777', 'passw0rd',
      'maggie', '159753', 'aaaaaa', 'ginger', 'princess', 'joshua',
      'cheese', 'amanda', 'summer', 'ashley', 'nicole', 'chelsea',
      'biteme', 'matthew', 'access', 'yankees', '987654321', 'dallas',
      'austin', 'thunder', 'taylor', 'matrix', 'welcome', 'admin',
      'login', 'secret', 'qwerty123', 'letmein123'
    ],

    strengthDisplay: function ($el, options) {
      var config = {
        fontSize: '12pt',
        padding: '4px',
        bad: 'Very bad',
        weak: 'Weak',
        good: 'Good',
        strong: 'Strong'
      };

      if (options) {
        $.extend(config, options);
      }

      // input rather than keyup, so the meter also reacts to paste and autofill.
      $el.bind('input', function () {
        var val = $(this).val(),
          $parent = typeof config.parent === 'undefined' ? $(this).parent() : $(config.parent),
          $displayContainer = $parent.find('.strength-meter'),
          strength = $.formUtils.validators.validate_strength.calculatePasswordStrength(val),
          css = {
            background: 'pink',
            color: '#FF0000',
            fontWeight: 'bold',
            border: 'red solid 1px',
            borderWidth: '0px 0px 4px',
            display: 'inline-block',
            fontSize: config.fontSize,
            padding: config.padding
          },
          text = config.bad;

        if ($displayContainer.length === 0) {
          $displayContainer = $('<span></span>');
          $displayContainer
            .addClass('strength-meter')
            .appendTo($parent);
        }

        if (!val) {
          $displayContainer.hide();
        } else {
          $displayContainer.show();
        }

        if (strength === 1) {
          text = config.weak;
        }
        else if (strength === 2) {
          css.background = 'lightyellow';
          css.borderColor = 'yellow';
          css.color = 'goldenrod';
          text = config.good;
        }
        else if (strength >= 3) {
          css.background = 'lightgreen';
          css.borderColor = 'darkgreen';
          css.color = 'darkgreen';
          text = config.strong;
        }

        $displayContainer
          .css(css)
          .text(text);
      });
    }
  });

  var requestServer = function (serverURL, $element, val, conf, callback) {
      var reqParams = $element.valAttr('req-params') || $element.data('validation-req-params') || {},
        inputName = $element.valAttr('param-name') || $element.attr('name'),
        handleResponse = function (response, callback) {
          callback(response);
        };

      if (!inputName) {
        throw new Error('Missing input name used for http requests made by server validator');
      }
      if (!reqParams) {
        reqParams = {};
      }
      if (typeof reqParams === 'string') {
        try {
          reqParams = JSON.parse(reqParams);
        } catch (ignored) {
          // Malformed req-params are treated as none at all.
          reqParams = {};
        }
      }
      reqParams[inputName] = val;

      $.ajax({
        url: serverURL,
        type: 'POST',
        cache: false,
        timeout: 30000,
        data: reqParams,
        dataType: 'json',
        error: function (error) {
          handleResponse({valid: false, message: 'Connection failed with status: ' + error.statusText}, callback);
          return false;
        },
        success: function (response) {
          handleResponse(response, callback);
        }
      });
    };

  /*
   * Server validation
   */
  $.formUtils.addAsyncValidator({
    name: 'server',
    validatorFunction: function (done, val, $input, conf, lang, $form) {
      var serverURL = $input.valAttr('url') || conf.backendUrl || '';
      if (!serverURL) {
        $.formUtils.warn('Server validator: no URL configured. Use data-validation-url or conf.backendUrl');
        done(false);
        return;
      }
      // @todo: deprecated class names that should be removed when moving up to 3.0
      $form.addClass('validating-server-side');
      $input.addClass('validating-server-side');
      requestServer(serverURL, $input, val, conf, function (response) {
        $form.removeClass('validating-server-side');
        $input.removeClass('validating-server-side');
        if (response.message) {
          $input.attr(conf.validationErrorMsgAttribute, $('<div></div>').text(response.message).html());
        }
        done(response.valid);
      });
    },
    errorMessage: '',
    errorMessageKey: 'badBackend'
  });

  /*
   * Check for only letters and numbers
   *
   * http://www.slovo.info/testuni.htm
   */
  $.formUtils.addValidator({
    name: 'letternumeric',
    validatorFunction: function (val, $el, config, language) {
      var patternStart = '^([a-zA-Z0-9\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        patternEnd = ']+)$',
        additionalChars = $el.valAttr('allowing'),
        pattern = '';

      if (additionalChars) {
        pattern = patternStart + additionalChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + patternEnd;
        var extra = additionalChars.replace(/\\/g, '');
        if (extra.indexOf(' ') > -1) {
          extra = extra.replace(' ', '');
          extra += language.andSpaces || $.formUtils.LANG.andSpaces;
        }
        this.errorMessage = language.badAlphaNumeric + language.badAlphaNumericExtra + extra;
      } else {
        pattern = patternStart + patternEnd;
        this.errorMessage = language.badAlphaNumeric;
      }

      return new RegExp(pattern).test(val);
    },
    errorMessage: '',
    errorMessageKey: 'requiredFields'
  });

  /*
   * Check password content depending on following parameters:
   *    data-validation-require-uc-letter,
   *    data-validation-require-lc-letter,
   *    data-validation-require-special-char,
   *    data-validation-require-numeral
  */
  var hasWarnedAboutComplexity = false;

  $.formUtils.addValidator({
    name : 'complexity',
    validatorFunction : function(value, $input, config, language) {
      if (!hasWarnedAboutComplexity) {
        hasWarnedAboutComplexity = true;
        $.formUtils.warn(
          'data-validation="complexity" enforces the composition rules that NIST ' +
          'SP 800-63B rev 4 retired, because they push people toward short ' +
          'predictable passwords. Prefer data-validation="strength", and ' +
          'data-validation="breached" alongside it. complexity is kept for sites ' +
          'working to a policy they do not control.'
        );
      }

      var numRequiredUppercaseChars = $input.valAttr('require-uc-letter') || '0',
        numRequiredLowercaseChars = $input.valAttr('require-lc-letter') || '0',
        numRequiredSpecialChars = $input.valAttr('require-special-char') || '0',
        numRequiredNumericChars = $input.valAttr('require-numeral') || '0',
        numRequiredCharsTotal = $input.valAttr('require-length') || '0',
        subValidators = {
          'uc-letter': {
            pattern: '^(?=(?:.*[A-Z]){'+numRequiredUppercaseChars+',}).+',
            numRequired: numRequiredUppercaseChars,
            dialogEnd: language.passwordComplexityUppercaseInfo
          },
          'lc-letter': {
            pattern: '^(?=(?:.*[a-z]){'+numRequiredLowercaseChars+',}).+',
            numRequired: numRequiredLowercaseChars,
            dialogEnd: language.passwordComplexityLowercaseInfo
          },
          'special-char': {
            pattern: '^(?=(?:.*(_|[!"#$%&\'()*+\\\\,-./:;<=>?@[\\]^_`{|}~])){'+numRequiredSpecialChars+',}).+',
            numRequired: numRequiredSpecialChars,
            dialogEnd: language.passwordComplexitySpecialCharsInfo
          },
          'numeral': {
            pattern: '^(?=(?:.*\\d){'+numRequiredNumericChars+',}).+',
            numRequired: numRequiredNumericChars,
            dialogEnd: language.passwordComplexityNumericCharsInfo
          },
          'length': {
            callback: function(val) {
              return val.length >= numRequiredCharsTotal;
            },
            numRequired: numRequiredCharsTotal,
            dialogEnd: language.lengthBadEnd
          }
        },
        errorMessage = '';

      $.each(subValidators, function(name, subValidator) {
        var numRequired = parseInt(subValidator.numRequired, 10);
        if (numRequired) {
          if (isNaN(numRequired) || numRequired < 0) {
            return;
          }
          var regexp = new RegExp(subValidator.pattern),
            valid = false;

          if (subValidator.callback) {
            valid = subValidator.callback(value);
          } else {
            valid = regexp.test(value);
          }

          if (!valid) {
            if (errorMessage === '') {
              errorMessage = language.passwordComplexityStart;
            }
            errorMessage += language.passwordComplexitySeparator + numRequired + subValidator.dialogEnd;
            $input.trigger('complexityRequirementValidation', [false, name]);
          } else {
            $input.trigger('complexityRequirementValidation', [true, name]);
          }
        }
      });
      if (errorMessage) {
        this.errorMessage = errorMessage + language.passwordComplexityEnd;
        return false;
      } else {
        return true;
      }
    },
    errorMessage : '',
    errorMessageKey: ''
  });

  /*
   * Google reCaptcha 2
   */
  $.formUtils.addValidator({
    name: 'recaptcha',
    validatorFunction: function (val, $el) {
      return grecaptcha.getResponse($el.valAttr('recaptcha-widget-id')) !== '';
    },
    errorMessage: '',
    errorMessageKey: 'badreCaptcha'
  });

  $.fn.displayPasswordStrength = function (conf) {
    new $.formUtils.validators.validate_strength.strengthDisplay(this, conf);
    return this;
  };

  var setupGooglereCaptcha = function (evt, $forms, config) {
    if (!$forms) {
      $forms = $('form');
    }
    if (typeof grecaptcha !== 'undefined' && !$.formUtils.hasLoadedGrecaptcha) {
      throw new Error('reCaptcha API can not be loaded by hand, delete reCaptcha API snippet.');
    } else if (!$.formUtils.hasLoadedGrecaptcha && $('[data-validation~="recaptcha"]', $forms).length) {
      $.formUtils.hasLoadedGrecaptcha = true;

      var src = '//www.google.com/recaptcha/api.js?onload=reCaptchaLoaded&render=explicit' + (config && config.lang ? '&hl=' + config.lang : '');
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      script.src = src;
      document.getElementsByTagName('body')[0].appendChild(script);
    }
  };

  window.reCaptchaLoaded = function ($forms) {
    if (!$forms || typeof $forms !== 'object' || !$forms.length) {
      $forms = $('form');
    }

    $forms.each(function () {
      var $form = $(this),
        config = $form.get(0).validationConfig || false;

      if (config) {
        $('[data-validation~="recaptcha"]', $form).each(function () {
          var $input = $(this),
            div = document.createElement('DIV'),
            siteKey = config.reCaptchaSiteKey || $input.valAttr('recaptcha-sitekey'),
            theme = config.reCaptchaTheme || $input.valAttr('recaptcha-theme') || 'light',
            size = config.reCaptchaSize || $input.valAttr('recaptcha-size') || 'normal',
            type = config.reCaptchaType || $input.valAttr('recaptcha-type') || 'image';

          if (!siteKey) {
            throw new Error('Google reCaptcha site key is required.');
          }

          var widgetId = grecaptcha.render(div, {
            sitekey: siteKey,
            theme: theme,
            size: size,
            type: type,
            callback: function (result) {
              $form.find('[data-validation~="recaptcha"]')
                .trigger('validation', (result && result !== ''));

            },
            'expired-callback': function() {
              $form.find('[data-validation~="recaptcha"]').trigger('validation', false);
            }
          });
          $input
            .valAttr('recaptcha-widget-id', widgetId)
            .hide()
            .on('beforeValidation', function (evt) {
              // prevent validator from skipping this input because its hidden
              evt.stopImmediatePropagation();
            })
            .parent()
            .append(div);
        });
      }
    });
  };

  $(window).on('validatorsLoaded formValidationSetup', setupGooglereCaptcha);

})(jQuery, window);


}));
