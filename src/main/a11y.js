/**
 * Accessibility helpers (attached to $.formUtils)
 *
 * Keeps the ARIA bookkeeping in one place so that dialogs.js stays concerned
 * with presentation only. A validation error has to reach assistive technology
 * as text associated with the field it belongs to -- conveying it with a border
 * colour and a CSS class alone fails WCAG 2.2 SC 1.4.1 (Use of Color) and
 * SC 3.3.1 (Error Identification).
 */
(function ($, window) {

  'use strict';

  /**
   * Remembers which aria-describedby token this plugin owns, so that tokens
   * put there by the page author are never clobbered on cleanup.
   */
  var OWN_TOKEN_ATTR = 'data-validation-describedby',

    idCounter = 0,

    /**
     * @param {String} prefix
     * @param {jQuery} $input
     * @return {String}
     */
    uniqueId = function (prefix, $input) {
      var base = $input.attr('name') || $input.attr('id') || 'field';
      idCounter++;
      return prefix + base.replace(/[^\w-]/g, '-') + '-' + idCounter;
    },

    /**
     * Current aria-describedby tokens of $input.
     * @param {jQuery} $input
     * @return {Array}
     */
    describedBy = function ($input) {
      var val = ($input.attr('aria-describedby') || '').trim();
      return val.length ? val.split(/\s+/) : [];
    },

    a11y = {

      /**
       * Give $input an id so that an error summary can link to it.
       *
       * @param {jQuery} $input
       * @return {String}
       */
      ensureInputId: function ($input) {
        var id = $input.attr('id');
        if (!id) {
          id = uniqueId('jfv-field-', $input);
          $input.attr('id', id);
        }
        return id;
      },

      /**
       * Flag $input as invalid. Applies in every error display mode -- with
       * an error summary there is no inline message to point at, but the
       * field itself still has to report its state.
       *
       * @param {jQuery} $input
       */
      markInvalid: function ($input) {
        $input.attr('aria-invalid', 'true');
      },

      /**
       * Flag $input as invalid and point it at the element holding its
       * error text, so screen readers read the message when the field is
       * focused rather than announcing only that something is wrong.
       *
       * @param {jQuery} $input
       * @param {jQuery} $message
       */
      describeError: function ($input, $message) {
        var id = $message.attr('id'),
          current;

        if (!id) {
          id = uniqueId('jfv-error-', $input);
          $message.attr('id', id);
        }

        // Polite rather than assertive: an error surfacing on blur should not
        // interrupt whatever the user is typing in the next field.
        if (!$message.attr('aria-live')) {
          $message.attr('aria-live', 'polite');
        }

        this.markInvalid($input);
        $input.attr(OWN_TOKEN_ATTR, id);

        current = describedBy($input);
        if ($.inArray(id, current) === -1) {
          current.push(id);
          $input.attr('aria-describedby', current.join(' '));
        }
      },

      /**
       * Drop the invalid flag and detach only the token added by
       * describeError(). aria-invalid is removed rather than set to "false"
       * so that a field which has not been validated yet carries no claim
       * about its validity either way.
       *
       * @param {jQuery} $input
       */
      clearError: function ($input) {
        var ownId = $input.attr(OWN_TOKEN_ATTR),
          remaining = [];

        $input.removeAttr('aria-invalid');

        if (!ownId) {
          return;
        }

        $.each(describedBy($input), function (i, token) {
          if (token !== ownId) {
            remaining.push(token);
          }
        });

        if (remaining.length) {
          $input.attr('aria-describedby', remaining.join(' '));
        } else {
          $input.removeAttr('aria-describedby');
        }

        $input.removeAttr(OWN_TOKEN_ATTR);
      },

      /**
       * Whether the user has asked the operating system to minimise animation.
       *
       * @return {Boolean}
       */
      prefersReducedMotion: function () {
        return !!(window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      },

      /**
       * Move focus to $elem, making it programmatically focusable first if it
       * is a plain container such as the error summary.
       *
       * @param {jQuery} $elem
       */
      focus: function ($elem) {
        if (!$elem || !$elem.length) {
          return;
        }

        if (!$elem.is('a,button,input,select,textarea,[tabindex]')) {
          $elem.attr('tabindex', '-1');
        }

        try {
          $elem.get(0).focus();
        } catch (err) {
          $.formUtils.warn('Unable to move focus to ' + $elem.get(0).nodeName);
        }
      }
    };

  $.formUtils = $.extend($.formUtils || {}, {
    a11y: a11y
  });

})(jQuery, window);
