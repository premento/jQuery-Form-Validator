/**
 * Bootstrap class-name presets (attached to $.formUtils)
 *
 * The class names this plugin has shipped since 2.x are Bootstrap 3 vintage:
 * `has-error` on the field's parent, `help-block` on the message. Bootstrap 4
 * removed every one of them, and validates instead through `is-invalid` on the
 * control itself with a sibling `.invalid-feedback` holding the message.
 * Bootstrap 5 kept that model.
 *
 * Changing the defaults would restyle every existing form, so the newer class
 * names are opt in:
 *
 *   $.validate({ bootstrap: 5 });
 *
 * The preset is layered between the defaults and the caller's own config, so an
 * option passed explicitly always beats the preset.
 *
 * @website https://github.com/premento/jQuery-Form-Validator
 * @license MIT
 */
(function ($) {

  'use strict';

  /*
   * Bootstrap 4 and 5 share the validation API, so they share a preset. What
   * differs between them (`.form-group`, `.custom-control`) is markup the
   * plugin never emits.
   */
  var validationApiPreset = {
        errorElementClass: 'is-invalid',
        successElementClass: 'is-valid',

        /*
         * `errorMessageClass` deliberately keeps its default. It is the hook the
         * plugin uses to find, update and remove its own messages, and Bootstrap
         * has no class that plays that role -- `invalid-feedback` is presentation
         * only. So the Bootstrap class is added to the inline message *alongside*
         * errorMessageClass rather than replacing it.
         *
         * Replacing it would also hide the error summary: `errorMessageTemplate`
         * interpolates errorMessageClass into the summary container, and
         * `.invalid-feedback` is `display: none` until an `.is-invalid` sibling
         * reveals it -- which a summary at the top of a form never has.
         */
        inlineErrorMessageClass: 'invalid-feedback',

        /* Bootstrap 4 dropped `help-block` in favour of `form-text`. */
        helpTextClass: 'form-text',

        /* `has-error` / `has-success` no longer exist. */
        inputParentClassOnError: '',
        inputParentClassOnSuccess: '',

        /*
         * An inline border-color beats `--bs-form-invalid-border-color`, because
         * an inline style outranks a class. Leaving it set means the field is
         * outlined in the Bootstrap 3 red while everything else uses the
         * Bootstrap 5 palette.
         */
        borderColorOnError: '',

        errorMessageTemplate: {
          container: '<div class="{errorMessageClass} alert alert-danger" role="alert">{messages}</div>',
          /* `mb-0` because the alert already carries the bottom spacing. */
          messages: '<strong>{errorTitle}</strong><ul class="mb-0">{fields}</ul>',
          field: '<li><a href="#{id}">{msg}</a></li>',
          fieldNoLink: '<li>{msg}</li>'
        }
      },

      presets = {
        // The defaults are already Bootstrap 3, so this is a no-op that exists
        // so `bootstrap: 3` can be stated explicitly.
        3: {},
        4: validationApiPreset,
        5: validationApiPreset
      },

      majorVersion = function (version) {
        return parseInt(String(version).split('.')[0], 10);
      };

  $.formUtils = $.extend($.formUtils || {}, {

    /**
     * @var {Object} Keyed by Bootstrap major version.
     */
    bootstrapPresets: presets,

    /**
     * Config overlay for a `bootstrap` option value. Accepts a number or a
     * string, and tolerates a full version (`'5.3.3'`). An unrecognised version
     * warns and changes nothing, so a typo cannot silently restyle a form.
     *
     * @param {Number|String|Boolean} [version]
     * @return {Object}
     */
    bootstrapPreset: function (version) {
      if (!version) {
        return {};
      }
      var key = majorVersion(version);
      if (!presets[key]) {
        $.formUtils.warn('Unknown bootstrap version "' + version +
          '". Expected 3, 4 or 5 -- carrying on with the default class names.');
        return {};
      }
      // Deep copy so a caller mutating conf cannot reach into the preset and
      // change it for every later $.validate() call.
      return $.extend(true, {}, presets[key]);
    },

    /**
     * Whether the configured Bootstrap version validates through `is-invalid`
     * and a sibling `.invalid-feedback`, which is true of 4 and 5 but not 3.
     * Message placement depends on it: Bootstrap 3 wants the message hoisted
     * out of an `.input-group`, and 4/5 need it left inside so that it stays a
     * sibling of the control.
     *
     * @param {Object} [conf]
     * @return {Boolean}
     */
    usesBootstrapValidationApi: function (conf) {
      if (!conf || !conf.bootstrap) {
        return false;
      }
      return majorVersion(conf.bootstrap) >= 4;
    }

  });

})(jQuery);
