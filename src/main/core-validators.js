/**
 * File declaring all default validators.
 */
(function($) {

  /*
   * Validate email
   */
  $.formUtils.addValidator({
    name: 'email',
    validatorFunction: function (email) {
      // Handle quoted local parts with embedded @
      var parts = [],
        currentPart = '',
        inQuotes = false;
      for (var i = 0; i < email.length; i++) {
        var ch = email[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          currentPart += ch;
        } else if (ch === '@' && !inQuotes) {
          parts.push(currentPart);
          currentPart = '';
        } else {
          currentPart += ch;
        }
      }
      parts.push(currentPart);

      if (parts.length !== 2) {
        return false;
      }

      var localPart = parts[0].toLowerCase(),
        domain = parts[1].toLowerCase();

      if (localPart && domain) {

        if( localPart.indexOf('"') === 0 ) {
          var len = localPart.length;
          if (localPart.lastIndexOf('"') !== len - 1) {
            return false; // Missing closing quote
          }
          localPart = localPart.replace(/\"/g, '');
          if( localPart.length !== (len-2) ) {
            // Check for escaped quotes inside
            var quoteCount = (parts[0].match(/\"/g) || []).length;
            if (quoteCount !== 2) {
              return false;
            }
          }
        }

        var domainValidator = $.formUtils.validators && $.formUtils.validators.validate_domain;
        return domainValidator && domainValidator.validatorFunction(domain) &&
          localPart.indexOf('.') !== 0 &&
          localPart.substring(localPart.length-1, localPart.length) !== '.' &&
          localPart.indexOf('..') === -1 &&
          !(/[^\w\+\.\-\#\-\_\~\!\$\&\'\(\)\*\+\,\;\=\:]/.test(localPart));
      }

      return false;
    },
    errorMessage: '',
    errorMessageKey: 'badEmail'
  });

  /*
   * Validate domain name
   */
  // A top level domain is either all letters, or an IDN A-label: "xn--"
  // followed by alphanumerics and hyphens. Rejecting every hyphen here
  // turned away real internationalised domains such as test.xn--fiqz9s
  // (.中国), so the two cases are spelled out.
  var TLD_PATTERN = /^(?:[a-zA-Z]{2,}|xn--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)$/;

  $.formUtils.addValidator({
    name: 'domain',
    validatorFunction: function (val) {
      var labels = val.split('.');
      var tld = labels[labels.length - 1];
      return val.length > 0 &&
        val.length <= 253 && // Including sub domains
        TLD_PATTERN.test(tld) &&
        !(/[^a-zA-Z0-9]/.test(val.substr(0, 1))) &&
        !(/[^a-zA-Z0-9\.\-]/.test(val)) &&
        val.split('..').length === 1 &&
        labels.length > 1;
    },
    errorMessage: '',
    errorMessageKey: 'badDomain'
  });

  /*
   * Validate required
   */
  $.formUtils.addValidator({
    name: 'required',
    validatorFunction: function (val, $el, config, language, $form) {
      switch ($el.attr('type')) {
        case 'checkbox':
          return $el.is(':checked');
        case 'radio':
          return $form.find('input[name="' + $el.attr('name') + '"]').filter(':checked').length > 0;
        default:
          if (typeof val === 'string') {
            return val.trim() !== '';
          }
          return !!val;
      }
    },
    errorMessage: '',
    errorMessageKey: function(config) {
      if (config.errorMessagePosition === 'top' || typeof config.errorMessagePosition === 'function') {
        return 'requiredFields';
      }
      else {
        return 'requiredField';
      }
    }
  });

  /*
   * Validate length range
   */
  $.formUtils.addValidator({
    name: 'length',
    validatorFunction: function (val, $el, conf, lang) {
      var lengthAllowed = $el.valAttr('length'),
        type = $el.attr('type');

      if (lengthAllowed === undefined) {
        $.formUtils.warn('Please add attribute "data-validation-length" to ' + $el[0].nodeName + ' named ' + $el.attr('name'));
        return true;
      }

      // check if length is above min, below max or within range.
      var len = type === 'file' && $el.get(0).files !== undefined ? $el.get(0).files.length : val.length,
        lengthCheckResults = $.formUtils.numericRangeCheck(len, lengthAllowed),
        checkResult;

      switch (lengthCheckResults[0]) {   // outside of allowed range
        case 'out':
          this.errorMessage = $.formUtils.resolveCountMessage(
            lang, 'lengthBadRange', 'lengthBadStart', lang.lengthBadEnd, lengthAllowed);
          checkResult = false;
          break;
        // too short
        case 'min':
          this.errorMessage = $.formUtils.resolveCountMessage(
            lang, 'lengthTooShort', 'lengthTooShortStart', lang.lengthBadEnd,
            lengthCheckResults[1], lengthCheckResults[1]);
          checkResult = false;
          break;
        // too long
        case 'max':
          this.errorMessage = $.formUtils.resolveCountMessage(
            lang, 'lengthTooLong', 'lengthTooLongStart', lang.lengthBadEnd,
            lengthCheckResults[1], lengthCheckResults[1]);
          checkResult = false;
          break;
        // ok
        default:
          checkResult = true;
      }

      return checkResult;
    },
    errorMessage: '',
    errorMessageKey: ''
  });

  /*
   * Validate url
   */
  $.formUtils.addValidator({
    name: 'url',
    validatorFunction: function (url) {
      var urlFilter = /^(https?|ftp):\/\/((((\w|-|\.|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|\[([^\]]+)\]|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])(\w|-|\.|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])(\w|-|\.|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/(((\w|-|\.|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/((\w|-|\.|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|\[|\]|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#(((\w|-|\.|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
      if (urlFilter.test(url)) {
        var afterProtocol = url.split('://')[1],
          // Strip userinfo if present
          atPos = afterProtocol.indexOf('@');
        if (atPos > -1) {
          afterProtocol = afterProtocol.substring(atPos + 1);
        }
        // Strip port if present
        var hostEnd = afterProtocol.indexOf('/');
        if (hostEnd === -1) {
          hostEnd = afterProtocol.indexOf('?');
        }
        if (hostEnd === -1) {
          hostEnd = afterProtocol.indexOf('#');
        }
        var host = hostEnd > -1 ? afterProtocol.substr(0, hostEnd) : afterProtocol;
        // Strip port
        var colonPos = host.lastIndexOf(':');
        if (colonPos > -1 && host.indexOf(']') === -1) {
          host = host.substring(0, colonPos);
        }
        // Strip IPv6 brackets
        if (host.indexOf('[') === 0 && host.lastIndexOf(']') > 0) {
          host = host.substring(1, host.lastIndexOf(']'));
          return host.split(':').length >= 2; // simple IPv6 check
        }
        var domainValidator = $.formUtils.validators && $.formUtils.validators.validate_domain;
        return domainValidator && domainValidator.validatorFunction(host);
      }
      return false;
    },
    errorMessage: '',
    errorMessageKey: 'badUrl'
  });

  /*
   * Validate number (floating or integer)
   */
  $.formUtils.addValidator({
    name: 'number',
    validatorFunction: function (val, $el, conf) {
      if (val !== '') {
        var allowing = $el.valAttr('allowing') || '',
          decimalSeparator = $el.valAttr('decimal-separator') || conf.decimalSeparator,
          allowsRange = false,
          begin, end,
          steps = $el.valAttr('step') || '',
          allowsSteps = false,
          sanitize = $el.attr('data-sanitize') || '',
          isFormattedWithNumeral = sanitize.match(/(^|[\s])numberFormat([\s]|$)/i);

        if (decimalSeparator === 'auto') {
          decimalSeparator = $.formUtils.localeDecimalSeparator();
        }

        if (isFormattedWithNumeral && val.length) {
          // numeral is optional as of 3.0; unformatNumber falls back to
          // stripping grouping characters when it is not on the page.
          val = $.formUtils.unformatNumber(val);
        }

        if (allowing.indexOf('number') === -1) {
          allowing += ',number';
        }

        if (allowing.indexOf('negative') === -1 && val.indexOf('-') === 0) {
          return false;
        }

        if (allowing.indexOf('range') > -1) {
          var rangeStart = allowing.indexOf('['),
            rangeSep = allowing.indexOf(';'),
            rangeEnd = allowing.indexOf(']');
          if (rangeStart === -1 || rangeSep === -1 || rangeEnd === -1 || rangeSep <= rangeStart || rangeEnd <= rangeSep) {
            return false;
          }
          begin = parseFloat(allowing.substring(rangeStart + 1, rangeSep));
          end = parseFloat(allowing.substring(rangeSep + 1, rangeEnd));
          if (isNaN(begin) || isNaN(end)) {
            return false;
          }
          allowsRange = true;
        }

        if (steps !== '') {
          allowsSteps = true;
        }

        if (decimalSeparator === ',') {
          if (val.indexOf('.') > -1) {
            // With a comma as the decimal separator a dot can only be a
            // thousands separator, so it has to fall on a group boundary.
            // Stripping every dot unconditionally turned "1.0236" -- a dot
            // used as a decimal point, which this input does not accept --
            // into the integer 10236.
            if (!/^[+-]?\d{1,3}(\.\d{3})*(,\d+)?$/.test(val)) {
              return false;
            }
            val = val.replace(/\./g, '');
          }
          val = val.replace(',', '.');
        }

        var isInt = function(v) {
          if (v === '-' || v === '') {
            return false;
          }
          return v.replace(/[0-9-]/g, '') === '';
        };

        var isFloat = function(v) {
          if (v === '-' || v === '' || v === '.' || v === '-.') {
            return false;
          }
          return /^-?[0-9]+\.[0-9]+$/.test(v);
        };

        var inRange = function(v) {
          return !allowsRange || (parseFloat(v) >= begin && parseFloat(v) <= end);
        };

        var stepCheck = function(v) {
          if (!allowsSteps) {
            return true;
          }
          var num = parseFloat(v);
          var step = parseFloat(steps);
          return Math.abs(num % step) < 1e-10 || Math.abs(num % step - step) < 1e-10;
        };

        if ((isInt(val) || (allowing.indexOf('float') > -1 && isFloat(val))) && inRange(val) && stepCheck(val)) {
          return true;
        }
      }
      return false;
    },
    errorMessage: '',
    errorMessageKey: 'badInt'
  });

  /*
   * Validate alpha numeric
   */
  $.formUtils.addValidator({
    name: 'alphanumeric',
    validatorFunction: function (val, $el, conf, language) {
      var patternStart = '^([a-zA-Z0-9',
        patternEnd = ']+)$',
        additionalChars = $el.valAttr('allowing'),
        pattern = '',
        hasSpaces = false;

      if (additionalChars) {
        pattern = patternStart + additionalChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + patternEnd;
        var extra = additionalChars.replace(/\\/g, '');
        if (extra.indexOf(' ') > -1) {
          hasSpaces = true;
          extra = extra.replace(' ', '');
          extra += language.andSpaces || $.formUtils.LANG.andSpaces;
        }

        if(language.badAlphaNumericAndExtraAndSpaces && language.badAlphaNumericAndExtra) {
          if(hasSpaces) {
            this.errorMessage = language.badAlphaNumericAndExtraAndSpaces + extra; 
          } else {
            this.errorMessage = language.badAlphaNumericAndExtra + extra + language.badAlphaNumericExtra; 
          }
        } else {
          this.errorMessage = language.badAlphaNumeric + language.badAlphaNumericExtra + extra;
        }
      } else {
        pattern = patternStart + patternEnd;
        this.errorMessage = language.badAlphaNumeric;
      }

      return new RegExp(pattern).test(val);
    },
    errorMessage: '',
    errorMessageKey: ''
  });

  /*
   * Validate against regexp
   */
  $.formUtils.addValidator({
    name: 'custom',
    validatorFunction: function (val, $el) {
      var pattern = $el.valAttr('regexp');
      if (!pattern) {
        $.formUtils.warn('Attribute "data-validation-regexp" is empty for ' + $el[0].nodeName + ' named ' + $el.attr('name'));
        return true;
      }
      var regexp = new RegExp(pattern);
      return regexp.test(val);
    },
    errorMessage: '',
    errorMessageKey: 'badCustomVal'
  });

  /*
   * Validate date
   */
  $.formUtils.addValidator({
    name: 'date',
    validatorFunction: function (date, $el, conf) {
      var dateFormat = $el.valAttr('format') || conf.dateFormat || 'yyyy-mm-dd',
        addMissingLeadingZeros = $el.valAttr('require-leading-zero') === 'false';
      return $.formUtils.parseDate(date, dateFormat, addMissingLeadingZeros) !== false;
    },
    errorMessage: '',
    errorMessageKey: 'badDate'
  });


  /*
   * Validate group of checkboxes, validate qty required is checked
   * written by Steve Wasiura : http://stevewasiura.waztech.com
   * element attrs
   *    data-validation="checkbox_group"
   *    data-validation-qty="1-2"  // min 1 max 2
   *    data-validation-error-msg="chose min 1, max of 2 checkboxes"
   */
  $.formUtils.addValidator({
    name: 'checkbox_group',
    validatorFunction: function (val, $el, conf, lang, $form) {
      // preset return var
      var isValid = true,
      // get name of element. since it is a checkbox group, all checkboxes will have same name
        elname = $el.attr('name'),
      // get checkboxes and count the checked ones
        $checkBoxes = $('input[type=checkbox][name^="' + elname + '"]', $form),
        checkedCount = $checkBoxes.filter(':checked').length,
      // get el attr that specs qty required / allowed
        qtyAllowed = $el.valAttr('qty');

      if (qtyAllowed === undefined) {
        var elementType = $el.get(0).nodeName;
        $.formUtils.warn('Attribute "data-validation-qty" is missing from ' + elementType + ' named ' + $el.attr('name'));
        return true;
      }

      // call Utility function to check if count is above min, below max, within range etc.
      var qtyCheckResults = $.formUtils.numericRangeCheck(checkedCount, qtyAllowed);

      // results will be array, [0]=result str, [1]=qty int
      switch (qtyCheckResults[0]) {
        // outside allowed range
        case 'out':
          this.errorMessage = $.formUtils.resolveCountMessage(
            lang, 'groupCheckedRange', 'groupCheckedRangeStart', lang.groupCheckedEnd, qtyAllowed);
          isValid = false;
          break;
        // below min qty
        case 'min':
          this.errorMessage = $.formUtils.resolveCountMessage(
            lang, 'groupCheckedTooFew', 'groupCheckedTooFewStart',
            lang.groupCheckedTooFewEnd || lang.groupCheckedEnd,
            qtyCheckResults[1], qtyCheckResults[1]);
          isValid = false;
          break;
        // above max qty
        case 'max':
          this.errorMessage = $.formUtils.resolveCountMessage(
            lang, 'groupCheckedTooMany', 'groupCheckedTooManyStart',
            lang.groupCheckedTooManyEnd || lang.groupCheckedEnd,
            qtyCheckResults[1], qtyCheckResults[1]);
          isValid = false;
          break;
        // ok
        default:
          isValid = true;
      }

      if( !isValid ) {
        var _triggerOnBlur = function() {
          $checkBoxes.unbind('click', _triggerOnBlur);
          $checkBoxes.filter('*[data-validation]').validateInputOnBlur(lang, conf, false, 'blur');
        };
        $checkBoxes.bind('click', _triggerOnBlur);
      }

      return isValid;
    }
    //   errorMessage : '', // set above in switch statement
    //   errorMessageKey: '' // not used
  });

})(jQuery);
