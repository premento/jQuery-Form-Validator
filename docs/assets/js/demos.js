/**
 * Wires up the live demos on examples.html.
 *
 * Each form is set up separately so it can show a different configuration, and
 * every one returns false from onSuccess — this is documentation, nothing
 * should actually be submitted.
 */
(function ($) {
  'use strict';

  if (!$ || !$.formUtils) {
    return;
  }

  var MODULE_PATH = 'assets/vendor/form-validator/';

  /** Report the outcome underneath a demo instead of navigating away. */
  function report(id, ok, message) {
    var el = document.getElementById(id);
    if (!el) { return; }
    el.textContent = message;
    el.className = 'demo-result show ' + (ok ? 'pass' : 'fail');
  }

  function onSuccess(resultId, message) {
    return function ($form) {
      report(resultId, true, message || 'Valid — this is where the form would be submitted.');
      return false;
    };
  }

  function onError(resultId) {
    return function () {
      report(resultId, false, 'Some fields still need attention.');
    };
  }

  /** A demo form's shared configuration. */
  function setup(formId, resultId, extra) {
    if (!document.getElementById(formId)) { return; }

    $.validate($.extend({
      form: '#' + formId,
      modules: '',
      scrollToTopOnError: false,
      onSuccess: onSuccess(resultId),
      onError: onError(resultId)
    }, extra || {}));
  }

  /* A rule registered purely to demonstrate addValidator(). */
  $.formUtils.addValidator({
    name: 'even',
    validatorFunction: function (value) {
      var n = parseInt(value, 10);
      return !isNaN(n) && n % 2 === 0;
    },
    errorMessage: 'Please give an even number',
    errorMessageKey: 'badEvenNumber'
  });

  /* The "add another row" button, wired before validation so the observer in
   * the dynamic demo has something to notice. */
  function initDynamicRows() {
    var button = document.getElementById('demo-add-row'),
      rows = document.getElementById('demo-dynamic-rows'),
      next = 1;

    if (!button || !rows) { return; }

    button.addEventListener('click', function () {
      var id = 'd8-e' + next,
        p = document.createElement('p'),
        label = document.createElement('label'),
        input = document.createElement('input');

      label.setAttribute('for', id);
      label.textContent = 'Email ' + (next + 1);

      input.id = id;
      input.name = 'email' + next;
      input.type = 'text';
      input.setAttribute('data-validation', 'email');

      p.appendChild(label);
      p.appendChild(input);
      rows.appendChild(p);

      input.focus();
      next++;
    });
  }

  $(function () {
    initDynamicRows();

    // Everything the demos need, from the copy vendored into this site.
    $.formUtils.loadModules('security, date, logic, sanitize', MODULE_PATH, function () {

      setup('demo-basic', 'demo-basic-result');

      setup('demo-summary', 'demo-summary-result', {
        errorMessagePosition: 'top'
      });

      setup('demo-password', 'demo-password-result', {
        onSuccess: onSuccess('demo-password-result', 'Strong enough, and the two fields match.')
      });

      setup('demo-logic', 'demo-logic-result');

      setup('demo-sanitize', 'demo-sanitize-result', {
        onSuccess: function ($form) {
          report('demo-sanitize-result', true,
            'Valid. Submitted values: ' + $form.serialize());
          return false;
        }
      });

      setup('demo-number', 'demo-number-result');
      setup('demo-checkbox', 'demo-checkbox-result');

      setup('demo-dynamic', 'demo-dynamic-result', {
        observeDynamicFields: true
      });

      setup('demo-custom', 'demo-custom-result');
      setup('demo-help', 'demo-help-result');
    });
  });

})(window.jQuery);
