# jQuery Form Validator [DISCONTINUED]

*Validation framework that let's you configure, rather than code, your validation logic.*

I started writing this plugin back in 2009 and it has given me much joy over the years. But all good things must come to an end and now it's time for this plugin to pull in its oars and go down with history.

**Upstream development stopped, and the notice above is the original author's.** This 3.0 release comes from a fork that resumed the work. jQuery 1.8 through 4.0 are supported, and every release is tested against 1.12.4, 2.2.4, 3.7.1 and 4.0.0 in CI — see [What's new in 3.0](#whats-new-in-30).

<!-- Travis was retired in 3.0; CI runs in GitHub Actions (.github/workflows/ci.yml). -->

[![npm version](https://badge.fury.io/js/jquery-form-validator.svg)](https://www.npmjs.com/package/jquery-form-validator)

*Usage example*

```html
<form action="" method="POST">
  <p>
    Name (4 characters minimum):
    <input name="user" data-validation="length" data-validation-length="min4" />
  </p>
  <p>
    Birthdate (yyyy-mm-dd):
    <input name="birth" data-validation="birthdate" />
  </p>
  <p>
    Website:
    <input name="website" data-validation="url" />
  </p>
  <p>
    <input type="submit" />
  </p>
</form>
<script src="js/jquery.min.js"></script>
<script src="js/form-validator/jquery.form-validator.min.js"></script>
<script>
    $.validate({
        modules : 'date, security'
    });
</script>
```

## What's new in 3.0

### Installing and importing

```
npm install jquery-form-validator
```

The package ships an ES module build, a UMD build and TypeScript declarations.

**As ES modules** — import the modules you need instead of naming them in the `modules` option. Each import registers its validators, so nothing is fetched at runtime and the page works under a strict Content-Security-Policy:

```js
import $ from 'jquery';
import 'jquery-form-validator';
import 'jquery-form-validator/modules/security';
import 'jquery-form-validator/lang/sv';
import 'jquery-form-validator/css';

$.validate({
    modules: 'security',   // already registered, so no network request
    lang: 'sv'
});
```

Naming a module in `modules` that has not been imported still falls back to fetching it at runtime, which is what a plain `<script>` page relies on.

**As a script tag** — unchanged from 2.x:

```html
<script src="node_modules/jquery-form-validator/dist/jquery.form-validator.min.js"></script>
```

**TypeScript** — declarations are bundled and require `@types/jquery`:

```
npm install --save-dev @types/jquery
```

### Package layout

| Path | Contents |
| ---- | -------- |
| `dist/` | UMD build. Canonical location as of 3.0. |
| `dist/esm/` | ES module build (`.mjs`). |
| `types/` | TypeScript declarations. |
| `form-validator/` | The 2.x output path, kept in step for one major version so existing CDN links keep resolving. Prefer `dist/`. |

Subpath exports: `jquery-form-validator`, `jquery-form-validator/modules/<name>`, `jquery-form-validator/lang/<code>`, `jquery-form-validator/css` and `jquery-form-validator/css/min`.

> **Note on tree-shaking.** This package declares `sideEffects: true`, and that is deliberate. Every file exists to register validators when it loads; nothing is exported. Marking the package side-effect free lets a bundler drop the very imports that do the work — in testing it reduced a real bundle from 304 kB to 38 bytes.

### Accessibility

Validation errors are now reported to assistive technology, not just styled:

 * Failing fields get `aria-invalid="true"`, in both `inline` and `top` error modes.
 * Inline messages are given an id and linked from the field with `aria-describedby`, so a screen reader reads the message when the field is focused. Any `aria-describedby` you set yourself is preserved — the plugin appends its own token and removes only that one.
 * Inline messages are `aria-live="polite"`, so an error appearing on blur is announced without interrupting typing.
 * The error summary (`errorMessagePosition: 'top'`) is a `role="alert"` and each entry links to the field it describes.
 * On a failed submit, focus moves to the error summary or to the first invalid field. Previously only the scrollbar moved, which left keyboard and screen reader users behind.
 * Help text fades are skipped when the visitor has asked for reduced motion.

The bundled theme was also corrected: error text is now `#843534`, which clears the WCAG AA 4.5:1 contrast threshold against the summary background (the previous `#b94a48` gave only 3.93:1), and summary links meet the 24×24px target size in WCAG 2.2.

### Validation now follows the value, not the keyboard

Live re-validation is bound to the `input` event instead of `keyup`. `keyup` never fires for paste, autofill, drag-and-drop, speech input or IME composition, so a field corrected by any of those stayed marked invalid until the next keystroke.

`$.fn.validateOnKeyUp` and `$.fn.removeKeyUpValidation` still work but are deprecated; use `$.fn.validateOnInput` and `$.fn.removeInputValidation`. A validator that opted out with `validateOnKeyUp: false` is still honoured, but the option is now called `validateOnInput`.

### Constraint Validation API bridge — module `native`

```js
$.validate({
    modules: 'native'
});
```

Loading the `native` module keeps the browser and the plugin in agreement about every field:

 * Each validation result is mirrored onto the element with `setCustomValidity()`, so `element.validity`, `form.checkValidity()` and the `:invalid` / `:user-invalid` CSS pseudo-classes all reflect your `data-validation` rules. Without it the browser considers a field valid while the plugin is showing an error on it.
 * `data-validation="native"` hands a field's constraints to the browser: `required`, `type="email"`, `type="url"`, `min`, `max`, `step`, `pattern`, `minlength` and `maxlength` are answered by `ValidityState` rather than by a regular expression. Messages still come from your configured language, falling back to the browser's own localised text.

To have the html5 module emit `native` instead of translating attributes into the plugin's own validators, add `preferNativeValidation: true`. This is off by default, so existing forms are unaffected.

### Async validation

Server-side checks no longer disable the field while a request is in flight. Disabling steals focus, drops the control out of the tab order, hides it from assistive technology, and omits it from form submission entirely. The field is now marked `aria-busy="true"` and keeps the `async-validation` class, so existing styling continues to work.

Checks are also debounced. A user who edits and leaves a field several times in quick succession now produces one request carrying the value they finished on, rather than one request per pass:

```html
<input name="username"
       data-validation="server"
       data-validation-debounce="500">
```

The default is 500ms. Set `data-validation-debounce="0"` to call out immediately. **Submitting is never debounced** — the user has already committed, so the request goes out at once no matter what the attribute says. The form stays halted for the whole window, so nothing can be submitted past a check that has not run yet.

### Customising the error summary

`errorMessageTemplate` was documented in 2.x but never actually read; the summary markup was hardcoded. It now works, and any subset of its keys may be overridden — whatever you leave out falls back to the default:

```js
$.validate({
    errorMessagePosition: 'top',
    errorMessageTemplate: {
        container: '<section class="{errorMessageClass}" role="alert">{messages}</section>',
        messages: '<h2>{errorTitle}</h2><ol>{fields}</ol>',
        field: '<li><a href="#{id}">{msg}</a></li>',
        fieldNoLink: '<li>{msg}</li>'
    }
});
```

| Placeholder | Available in | Meaning |
| ----------- | ------------ | ------- |
| `{errorMessageClass}` | `container` | The configured `errorMessageClass`. |
| `{messages}` | `container` | The rendered `messages` template. |
| `{errorTitle}` | `messages` | The `errorTitle` language string. |
| `{fields}` | `messages` | The rendered `field` templates, concatenated. |
| `{msg}` | `field`, `fieldNoLink` | The validation message. |
| `{id}` | `field` | The id of the field the message belongs to, generated if the field has none. |

`fieldNoLink` is used when there is no input to link to. Substitution is single-pass, so a validation message that happens to contain something like `{fields}` is inserted literally rather than treated as a placeholder.

### Bootstrap 4 and 5

The class names this plugin has shipped since 2.x are Bootstrap 3 vintage — `has-error` on the
field's parent, `help-block` on the message. Bootstrap 4 removed every one of them and validates
instead through `is-invalid` on the control itself with a sibling `.invalid-feedback` holding the
message; Bootstrap 5 kept that model. On a Bootstrap 5 page the stock defaults therefore validate
correctly but render **unstyled** — messages come out as plain body-coloured text, and the invalid
border is drawn in the old Bootstrap 3 red.

Changing the defaults would restyle every existing form, so the newer class names are opt in:

```js
$.validate({
    modules: 'security',
    bootstrap: 5          // or 4, or a full version such as '5.3.3'
});
```

That is the whole change. `bootstrap: 3` is accepted and does nothing, since the defaults are already
Bootstrap 3, and omitting the option entirely behaves exactly as before.

| Option | Default (Bootstrap 3) | With `bootstrap: 5` |
| ------ | --------------------- | ------------------- |
| `errorElementClass` | `'error'` | `'is-invalid'` |
| `successElementClass` | `'valid'` | `'is-valid'` |
| `inlineErrorMessageClass` | `'help-block'` | `'invalid-feedback'` |
| `helpTextClass` | `'help-block'` | `'form-text'` |
| `inputParentClassOnError` | `'has-error'` | `''` |
| `inputParentClassOnSuccess` | `'has-success'` | `''` |
| `borderColorOnError` | `'#b94a48'` | `''` |

The preset is layered between the defaults and your own config, so **an option you pass explicitly
always wins**:

```js
$.validate({ bootstrap: 5, errorElementClass: 'my-own-class' });   // your class is used
```

Three details are worth knowing:

 * **`errorMessageClass` deliberately does not change.** It stays `form-error`, because it is the hook
   the plugin uses to find, update and remove its own messages, and Bootstrap has no class that plays
   that role — `invalid-feedback` is presentation only. So an inline message ends up with both:
   `class="form-error invalid-feedback"`. Setting `errorMessageClass` to `invalid-feedback` yourself is
   the one thing not to do: `errorMessageTemplate` interpolates it into the error summary container,
   and `.invalid-feedback` is `display: none` until an `.is-invalid` sibling reveals it — which a
   summary at the top of a form never has, so the whole summary would silently vanish.

 * **Messages inside an `.input-group` now stay inside it.** Bootstrap 3 wants the message hoisted out
   of the group; Bootstrap 4 and 5 reveal it with `.is-invalid ~ .invalid-feedback`, so hoisting leaves
   it permanently `display: none` — the field is flagged with no reason shown. Under `bootstrap: 4`/`5`
   the message is appended inside the group instead, and `has-validation` is added to it so the
   control keeps Bootstrap's rounded edge. Both are removed again when the field validates.

 * **Do not load `theme-default.css`.** It styles `input.error`, `div.form-error` and `.help-block`,
   which would double up on Bootstrap's own validation styling. Bootstrap 5 provides all of it.

`errorMessagePosition: 'top'` needs no extra configuration — the summary renders as a Bootstrap
`alert alert-danger` and each entry links to its field.

Two helpers are public, for custom renderers that need to make the same distinction:
`$.formUtils.bootstrapPreset(version)` returns the config overlay for a version, and
`$.formUtils.usesBootstrapValidationApi(conf)` is true for 4 and 5 but not 3. An unrecognised version
logs a warning and changes nothing, so a typo cannot silently restyle a form.

See [test/bootstrap5.html](test/bootstrap5.html) for a working page covering inline messages, input
groups, checkboxes, help text and the error summary.

### Passwords

> **Breaking.** `data-validation="strength"` scores passwords differently in 3.0. Values that passed before may now be rejected, and vice versa. The attribute, the 0–3 scale and the thresholds are unchanged — only the scoring is. Re-check any form that relies on a particular `data-validation-strength` level.

The previous scoring awarded points for composition: mixed case, digits, symbols. NIST SP 800-63B rev 4 (finalised July 2025) retired composition rules, because they push people toward short predictable passwords. The old algorithm demonstrated the problem: `P@ss1!` scored 3 of 3, while a sixteen-character lowercase password scored 2.

Scoring is now length-driven, and only counts length an attacker actually has to guess:

| Password | Old score | New score |
| -------- | --------- | --------- |
| `P@ss1!` | 3 | 0 |
| `Tr0ub4dor&3` | 3 | 1 |
| `abcdefghijklmnop` | 2 | 0 |
| `aaaaaaaaaaaaaaaaaaaa` | 0 | 0 |
| `thequickbrownfox` | 2 | 3 |
| `correcthorsebatterystaple` | 3 | 3 |

Runs (`aaaa`) and sequences (`abcd`, `9876`) are discounted from the third character onward, and a short list of passwords that dominate every breach corpus scores 0 regardless of length — `Password1!` and `letmein123` included. Thresholds follow rev 4: 8 effective characters is the floor for an account with a second factor, 15 for one without.

`data-validation="complexity"` still works but is deprecated, and logs a warning. It enforces exactly the composition rules rev 4 retired. It is kept for sites working to a policy they do not control.

A password field with a `maxlength` below 64 now logs an advisory. Rev 4 asks that at least 64 characters be accepted and that longer values are never silently truncated. Nothing is overridden — the limit may not be yours to change.

#### Screening against known breaches

```html
<input type="password" name="password" data-validation="strength breached">
```

`data-validation="breached"` checks the value against [Have I Been Pwned](https://haveibeenpwned.com/API/v3#PwnedPasswords). It is **opt-in and it talks to the network**: every check makes an HTTPS request.

The password itself never leaves the browser. Only the first five hex characters of its SHA-1 are sent; the service returns every suffix sharing that prefix and the match is made locally — the k-anonymity model the API is built around. In practice the request looks like `GET https://api.pwnedpasswords.com/range/5BAA6` and nothing else.

Notes:

 * It needs `crypto.subtle` and `fetch`, so it only runs in a secure context (https, or localhost). Elsewhere it logs a warning and passes the value.
 * It **fails open**. If the service cannot be reached the value is allowed and a warning is logged, because an outage of a third-party service should not become an outage of your form. Your other password rules still apply.
 * It is an async validator, so it is debounced like any other — see [Async validation](#async-validation). Set `data-validation-debounce` to tune it.
 * Point `data-validation-breach-url` at your own endpoint to use a self-hosted range API instead.

### Messages and localisation

Messages that carry a number used to be assembled by concatenating two fragments around it:

```js
lengthTooShortStart: 'The input value is shorter than ',
lengthBadEnd: ' characters'
```

That pins every language to English word order and cannot express plural forms. 3.0 adds whole-sentence templates with a `{0}` placeholder, and plural forms where a count decides the wording:

```js
lengthTooShort: {
    one: 'The input value is shorter than {0} character',
    other: 'The input value is shorter than {0} characters'
}
```

Plural category selection uses `Intl.PluralRules`, so languages with more than two forms are handled properly rather than being forced into `item(s)`.

**Nothing breaks.** The old fragment keys are still present in every bundled language and are still honoured: if a template is absent, the fragments are concatenated exactly as before. A `language` override that only sets the old keys keeps working unchanged.

All 20 bundled languages now carry templates, composed mechanically from the fragments they already contained, so today's output is byte-identical. They are flat strings rather than plural objects — a trailing fragment such as `' tecken'` does not reveal what the singular should be. Translators can now reorder the sentence, and add plural forms where their language needs them:

```js
$.validate({
    language: {
        groupCheckedTooFew: {
            one: 'Choose at least {0} option',
            few: 'Choose at least {0} options',
            other: 'Choose at least {0} options'
        }
    }
});
```

Helpers are available directly: `$.formUtils.formatMessage(template, params, count)`, `$.formUtils.selectPluralForm(forms, count)` and `$.formUtils.locale()`.

### The accessibility helpers

The behaviour described under [Accessibility](#accessibility) is implemented by `$.formUtils.a11y`,
which is public so a custom validator or a custom error renderer can keep the same guarantees:

| Method | Description |
| ------ | ----------- |
| `ensureInputId($input)` | Return the field's id, generating and assigning one if it has none. Used to make summary entries linkable. |
| `markInvalid($input)` | Set `aria-invalid="true"` on the field. |
| `describeError($input, $message)` | Give the message an id, point the field's `aria-describedby` at it, and mark it `aria-live="polite"`. Any `aria-describedby` you set yourself is preserved. |
| `clearError($input)` | Remove `aria-invalid` and drop only the token this plugin added to `aria-describedby`. |
| `prefersReducedMotion()` | `true` when the visitor has asked for reduced motion, so animations can be skipped. |
| `focus($elem)` | Move focus to an element that is not natively focusable, adding `tabindex="-1"` as needed. |

### Numbers

`decimalSeparator` gains an `'auto'` setting that takes the separator from the browser locale via `Intl.NumberFormat`:

```js
$.validate({ decimalSeparator: 'auto' });
```

It is **opt-in, and the default is still `'.'`** — deliberately. A form that posts to a server expecting `1.5` should not silently start accepting `1,5` because a visitor's browser is set to German. What matters is the site's locale, which the library cannot know.

A new `localeNumberFormat` sanitizer formats through `Intl.NumberFormat`, with no third-party dependency:

```html
<input data-sanitize="localeNumberFormat"
       data-sanitize-locale="de-DE"
       data-sanitize-number-options='{"minimumFractionDigits":2}'>
```

The existing `numberFormat` sanitizer still uses [numeral.js](http://numeraljs.com/) and its pattern syntax, and is unchanged. numeral is now genuinely optional: validating a `numberFormat` field without it on the page used to throw `ReferenceError`, and now degrades to stripping grouping characters.

### Build and CI

 * Travis (pinned to Node 4.2.4, and long dead for open source) is replaced by GitHub Actions, testing Node 20 and 22 against jQuery 1.12.4, 2.2.4, 3.7.1 and 4.0.0, plus a job running `publint` and `attw` on the package.
 * JSHint is replaced by ESLint with a flat config. The old `onevar` rule, which required a single `var` statement per function, is gone — no code in this project was written that way.
 * `grunt test` no longer depends on a browser path hardcoded to one machine; set `CHROME_BIN` or let puppeteer resolve its own.

### New configuration options

| Option | Default | Description |
| ------ | ------- | ----------- |
| `focusOnError` | `true` | Move focus to the error summary, or the first invalid input, on a failed submit. |
| `novalidate` | `true` | Add `novalidate` to the form so the browser does not raise its own error bubbles over the plugin's messages. A `novalidate` attribute you wrote yourself is never removed. |
| `preferNativeValidation` | `false` | With the `native` module loaded, let the browser answer `type`/`min`/`max`/`step`/`pattern` instead of translating them. |
| `observeDynamicFields` | `false` | Watch the form with a `MutationObserver` and wire up fields added after `$.validate()` ran, instead of requiring `$.validate()` to be called again. |
| `errorMessageTemplate` | see above | Markup used to build the error summary. Documented since 2.x but only actually honoured from 3.0. |
| `decimalSeparator` | `'.'` | Set to `'auto'` to take it from the browser locale via `Intl.NumberFormat`. |

### Fixed

Five validators regressed in 2.3.79 and are corrected here. Each had a failing test in the suite that was never green.

 * **Internationalised domains were rejected.** The top level domain was required to be entirely alphanumeric, which turns away every IDN A-label, since those contain hyphens — `test.xn--fiqz9s` (.中国) among them. TLDs that genuinely start or end with a hyphen are still rejected. This also fixes URL validation, which delegates to the domain validator.

 * **The CVV validator never learned the card type.** The credit card validator works out whether the form accepts American Express, which decides whether a CVV is three digits or four. That was being written to the card element and read from the CVV element, so it never arrived, and an amex-only form rejected valid four digit codes. It now lives on the form, which both fields can see — and still cannot leak between two forms on one page, which is what moving it off module scope was meant to prevent.

 * **`1.0236` was accepted as an integer.** With `decimal-separator` set to `,`, a dot can only be a thousands separator, and every dot was being stripped unconditionally — turning a dot used as a decimal point into `10236`. Dots must now fall on a group boundary, so `1.234.567,89` is accepted and `1.0236` is not.

 * **A date format without a day was always invalid.** `mm/yyyy` is a legitimate format, but an absent unit was reported as `-1` and then treated as an invalid zero. Absent units are now skipped, and come back as `1` so date arithmetic still works.

 * **A malformed quoted address was expected to validate.** `"sasas-sdsd"sdfsdf.sdff@monkey.com` is not a valid address: RFC 5322 gives `obs-local-part = word *("." word)`, and a quoted string followed straight by more text with no dot between them is not a valid word sequence. The validator was right to reject it; the test expectation was wrong and has been corrected. Fully quoted local parts such as `"sasas-sdsd"@monkey.com` are still accepted.

### Deprecated

 * `data-validation="complexity"` — enforces composition rules NIST SP 800-63B rev 4 retired. Use `strength`, ideally with `breached`.
 * `$.fn.validateOnKeyUp` and `$.fn.removeKeyUpValidation` — use `validateOnInput` and `removeInputValidation`.
 * A validator opting out with `validateOnKeyUp: false` is still honoured; the option is now `validateOnInput`.

### Removed

 * The `placeholder` and `datalist` shims for pre-HTML5 browsers have been dropped from the html5 module. Every supported browser implements both natively.
 * The IE7 `onreadystatechange` branch and the runtime script-injection fallback in the module loader have been reworked: modules already registered by an `import` no longer trigger a network request, and `lang/sv` and `lang/sv.js` now resolve to the same module.

### Note on module and rule names

`$.split` treats `-` as a delimiter, so a module or rule name containing a hyphen is read as two separate names. This is why the Constraint Validation module is called `native` and not `constraint-api`.


### Support for HTML5

This plugin can serve as a fallback solution for the validation attributes in the HTML5 spec. With the html5 module you can use the following native features:

**Attributes**: require, pattern, maxlength, min, max, placeholder

**Input types**: url, date, time, email, number

**Elements**: `datalist` is used by the browser directly; the shim for browsers without it was removed in 3.0.


### Default validators and features (no module needed)
 * **url**
 * **email**
 * **domain** — *domain.com*
 * **number** — *float/negative/positive/range/step*
 * **date** — *yyyy-mm-dd (format can be customized, more information below)*
 * **alphanumeric** — *with support for defining additional characters*
 * **length** — *min/max/range*
 * **required** — *no validation except that a value has to be given*
 * **custom** — *Validate value against regexp*
 * **checkbox_group** — *ensure at least 1 checkbox in group has been selected*
 * Show help information automatically when input is focused
 * Validate given values immediately when input looses focus.
 * Make validation optional by adding attribute data-validation-optional="true" to the element. This means
 that the validation defined in data-validation only will take place in case a value is given.
 * Make validation dependent on another input of type checkbox being checked by adding attribute
 data-validation-if-checked="name of checkbox input"
 * Create input suggestions with ease, no jquery-ui needed
 * to apply multiple validators to an input element, separate the validator names using a space (ex: required email)

Read the documentation for the default features at [#default-validators](#default-validators)

### Module: security
 * **spamcheck**
 * **confirmation**
 * **creditcard**
 * **cvv** — *card security code; length follows the card type the form accepts*
 * **strength** — *Validate the strength of a password (rescored in 3.0, see [Passwords](#passwords))*
 * **breached** — *Check a password against Have I Been Pwned. Opt-in; makes a network request*
 * **complexity** — *Deprecated in 3.0. Enforces composition rules NIST retired*
 * **server** — *Validate value of input on server side*
 * **letternumeric** — *Validate that the input value consists out of only letters and/or numbers*
 * **recaptcha** - *Validate Google [reCaptcha 2](https://www.google.com/recaptcha/intro/index.html)*

Read the documentation for the security module at [#security-validators](#security-validators)

### Module: date
 * **time** — *hh:mm*
 * **birthdate** — *yyyy-mm-dd, not allowing dates in the future or dates that's older than 122 years (format can be customized, more information below)*

Read the documentation for the date module at [#date-validators](#date-validators)

### Module: location
 * **country**
 * **federatestate**
 * **longlat**
 * Suggest countries (english only)
 * Suggest states in the US

Read the documentation for the location module at [#location-validators](/#location-validators)

### Module: file
 * **mime**
 * **extension**
 * **size** (file size)
 * **dimension** (size dimension and ratio)

Read the documentation for the file module at [#file-validators](#file-validators)

### Module: logic

* **Dependent validation**
* **Require "one-of"**

Read the documentation for this module at [/#logic](#logic)

### Module: sepa

* **iban** — *validate an International Bank Account Number*
* **bic** — *validate a Bank Identifier Code*
* **sepa** — *validate an IBAN that belongs to the SEPA area*

Read the documentation for this module at [http://formvalidator.net/#sepa](http://www.formvalidator.net/#sepa)


### Module: sweden
 * **swesec** — *validate swedish social security number*
 * **swephone** — *validate that the value is a swedish telephone number*
 * **swemobile** — *validate that the value is a swedish mobile telephone number*
 * **swecounty** — *validate that the value is an existing county in Sweden*
 * **swemunicipality** — *validate that the value is an existing municipality in Sweden*
 * Suggest county
 * Suggest municipality

Read the documentation for the Swedish module at [http://formvalidator.net/#sweden-validators](http://www.formvalidator.net/#country-specific-validators_sweden)

### Module: uk
 * **ukvatnumber**
 * **uknin**
 * **ukutr**

Read the documentation for the UK module at [http://formvalidator.net/#uk-validators](http://www.formvalidator.net/#country-specific-validators_uk)

### Module: brazil
 * **brphone** — *Validate a brazilian telephone number*
 * **cep**
 * **cpf**

### Module: poland
 * **plpesel** - *validate polish personal identity number (in Polish identity cards)*
 * **plnip** - *validate polish VAT identification number*
 * **plregon** - *validate polish bussiness identity number*

### Module: color
 * **hex** - *validate hex color format*
 * **rgb** - *validate rgb color format*
 * **rgba** - *validate rgba color format*
 * **hsl** - *validate hsl color format*
 * **hsla** - *validate hsla color format*

### Module: native

*New in 3.0.* Bridges the browser's Constraint Validation API — see
[Constraint Validation API bridge](#constraint-validation-api-bridge--module-native).

 * **native** — *hand a field's HTML constraints to the browser and let `ValidityState` answer them*
 * Mirrors every validation result onto the element with `setCustomValidity()`, so `element.validity`,
   `form.checkValidity()` and the `:invalid` / `:user-invalid` pseudo-classes agree with your
   `data-validation` rules.

### Module: html5

Serves as a fallback for the HTML5 validation attributes, and validates `type="url"`, `type="email"`,
`type="number"`, `type="date"` and `type="time"` inputs. See [Support for HTML5](#support-for-html5).
Add `preferNativeValidation: true` to have it emit `native` instead of translating attributes into the
plugin's own validators.

### Module: toggleDisabled

Enables and disables the form's submit buttons as the form becomes valid or invalid, adding and
removing a `disabled` class alongside the `disabled` attribute. Acts on value change, not only on
mouse click.

```js
$.validate({ modules: 'toggleDisabled' });
```

### Module: jsconf

Configure validation in JavaScript instead of with `data-validation` attributes, for cases where the
markup is not yours to change. Exposes `$.setupValidation()`:

```js
$.setupValidation({
    form: '#my-form',
    validate: {
        'user':  {validation: 'length', length: 'min4'},
        'email': {validation: 'email'}
    }
});
```

Attributes not prefixed with `data-validation` may also be declared here.

### Module: sanitation
 * **trim**
 * **trimLeft**
 * **trimRight**
 * **upper**  — Convert all letters to upper case
 * **lower**  — Convert all letters to lower case
 * **capitalize**  — Convert the first letter in all words to upper case
 * **insertRight**  — Declare a text that should be inserted at the end of the value, attribute data-sanitize-insert-right
 * **insertLeft**  — Declare a text that should be inserted at the beginning of the value, attribute data-sanitize-insert-left
 * **escape**  — Convert < > & ' " to html entities
 * **strip**  — Comma separated list with words that gets automatically removed
 * **insert**  — Insert text at either end, used via insertLeft/insertRight
 * **numberFormat**  — Declare the attribute data-sanitize-number-format with any of the formats described on http://numeraljs.com/. Note that this rule requires that numeral.js is included in the page. As of 3.0 numeral is genuinely optional — without it the value degrades to having grouping characters stripped instead of throwing
 * **localeNumberFormat**  — *New in 3.0.* Format through `Intl.NumberFormat`, no third-party dependency. See [Numbers](#numbers)

Read the documentation for the sanitation module at [http://formvalidator.net/#data-sanitation](http://formvalidator.net/#data-sanitation)


## Writing a custom validator
You can use the function `$.formUtils.addValidator()` to add your own validation function. Here's an example of a validator
that checks if the input contains an even number.

```html
<form action="" method="POST">
    <p>
        <input type="text" data-validation="even" />
    </p>
    ...
</form>
<script src="js/jquery.min.js"></script>
<script src="js/form-validator/jquery.form-validator.min.js"></script>
<script>

    // Add validator
    $.formUtils.addValidator({
        name : 'even',
        validatorFunction : function(value, $el, config, language, $form) {
            return parseInt(value, 10) % 2 === 0;
        },
        errorMessage : 'You have to answer an even number',
        errorMessageKey: 'badEvenNumber'
    });

    // Initiate form validation
    $.validate();

</script>
```

### Required properties passed into $.formUtils.addValidator

*name* - The name of the validator, which is used in the validation attribute of the input element.

*validatorFunction* - Callback function that validates the input. Should return a boolean telling if the value is considered valid or not.

*errorMessageKey* - Name of language property that is used in case the value of the input is invalid.

*errorMessage* - An alternative error message that is used if errorMessageKey is left with an empty value or isn't defined
in the language object. Note that you also can use [inline error messages](http://formvalidator.net/#localization) in your form.


The validation function takes these five arguments:
- value — the value of the input thats being validated
- $el — jQuery object referring to the input element being validated
- config — Object containing the configuration of this form validation
- language — Object with error dialogs
- $form — jQuery object referring to the form element being validated

## Creating a custom module

A "module" is basically a javascript file containing one or more calls to [$.formUtils.addValidator()](#writing-a-custom-validator).
The module file must be placed in the same directory as `jquery.form-validator.min.js` if you want it to load automatically via the setup function.

You can use the method `$.formUtils.loadModules` if you want to load the module from a custom path.

```js
$.formUtils.loadModules('customModule otherCustomModule', 'js/validation-modules/');
$.validate({
   modules: 'security, date'
});
```

The first argument of `$.formUtils.loadModules` is a comma separated string with names of module files, without
file extension.

The second argument is the path where the module files are located. This argument is optional, if not given
the module files has to be located in the same directory as the core modules shipped together with this jquery plugin
(js/form-validator/)

## Show help information
It is possible to display help information for each input. The information will fade in when input is focused and fade out when input looses focus.

```html
<form action="" id="my_form">
	<p>
	  <strong>Why not:</strong>
	  <textarea name="why" data-validation-help="Please give us some more information" data-validation="required"></textarea>
	</p>
	...
```

## Fully customizable

Every option below is passed to `$.validate()`. The narrative documentation lives at
[http://formvalidator.net/#configuration](http://formvalidator.net/#configuration); this table is the
complete list as it stands in the source.

### Setup

| Option | Default | Description |
| ------ | ------- | ----------- |
| `form` | `'form'` | Selector for the form(s) to set up. |
| `modules` | `''` | Comma separated modules to load. Modules already registered by an `import` are not fetched. |
| `lang` | — | Language code to load from `lang/`, e.g. `'sv'`. |
| `language` | `false` | Object overriding individual messages. See [Messages and localisation](#messages-and-localisation). |
| `ignore` | `[]` | Names of inputs to skip even if they carry validation rules. |
| `novalidate` | `true` | Add `novalidate` to the form so the browser does not stack its own bubbles on the plugin's messages. A `novalidate` you wrote yourself is never removed. |
| `observeDynamicFields` | `false` | Watch the form with a `MutationObserver` and wire up fields added after `$.validate()` ran. |
| `preferNativeValidation` | `false` | With the `native` module loaded, let the browser answer `type`/`min`/`max`/`step`/`pattern`. |
| `validateHiddenInputs` | `false` | Whether hidden inputs are validated. |
| `bootstrap` | `false` | Which Bootstrap release the page uses, so the matching class names are emitted: `3`, `4`, `5`, or a full version. See [Bootstrap 4 and 5](#bootstrap-4-and-5). |

### When validation runs

| Option | Default | Description |
| ------ | ------- | ----------- |
| `validateOnBlur` | `true` | Validate a field when it loses focus. |
| `validateOnEvent` | `false` | Honour `data-validation-event="click"` on an element. See [Validate On Event](#validate-on-event). |
| `validateCheckboxRadioOnClick` | `true` | Validate checkboxes and radios as soon as they are clicked. |
| `showHelpOnFocus` | `true` | Fade in `data-validation-help` text on focus. |
| `addSuggestions` | `true` | Enable the input-suggestion feature. |

### Error presentation

| Option | Default | Description |
| ------ | ------- | ----------- |
| `errorMessagePosition` | `'inline'` | `'inline'` or `'top'`. `'top'` renders the error summary. |
| `errorMessageTemplate` | see [Customising the error summary](#customising-the-error-summary) | Markup used to build the summary. Honoured from 3.0. |
| `errorMessageClass` | `'form-error'` | Class on the element holding an error message. This is the plugin's own hook for finding its messages — see the note under [Bootstrap 4 and 5](#bootstrap-4-and-5) before changing it. |
| `inlineErrorMessageClass` | `'help-block'` | Extra class on an inline message, for the CSS framework to style. `'invalid-feedback'` under `bootstrap: 4`/`5`. |
| `helpTextClass` | `'help-block'` | Extra class on `data-validation-help` text. `'form-text'` under `bootstrap: 4`/`5`. |
| `errorElementClass` | `'error'` | Class applied to an invalid field. |
| `successElementClass` | `'valid'` | Class applied to a field that validated. |
| `addValidClassOnAll` | `false` | Apply `successElementClass` even to fields that were not validated. |
| `inputParentClassOnError` | `'has-error'` | Class on the invalid field's parent (Bootstrap default). |
| `inputParentClassOnSuccess` | `'has-success'` | Class on the valid field's parent (Bootstrap default). |
| `borderColorOnError` | `'#b94a48'` | Border colour for an invalid field. Empty string leaves the border alone. |
| `scrollToTopOnError` | `true` | Scroll to the summary on a failed submit. |
| `focusOnError` | `true` | Move focus to the summary, or the first invalid field, on a failed submit. See [Accessibility](#accessibility). |
| `inlineErrorMessageCallback` | `false` | `function($input, errorMsg, conf)` returning the element the inline message should be written into, for full control over placement. Return a falsy value to take over display entirely and suppress the plugin's own. |
| `submitErrorMessageCallback` | `false` | `function($form, errorMessages, conf)` returning the container for the error summary. Return a falsy value to handle display yourself. Replaces the deprecated `errorMessageCustom`. |

### Parsing

| Option | Default | Description |
| ------ | ------- | ----------- |
| `validationRuleAttribute` | `'data-validation'` | Attribute holding the validation rules. |
| `validationErrorMsgAttribute` | `'data-validation-error-msg'` | Attribute holding a per-field custom message. |
| `dateFormat` | `'yyyy-mm-dd'` | Format used by the `date` and `birthdate` validators. |
| `decimalSeparator` | `'.'` | Set to `'auto'` to take it from the browser locale. See [Numbers](#numbers). |

### Callbacks

| Option | Default | Description |
| ------ | ------- | ----------- |
| `onModulesLoaded` | `null` | Called once every module named in `modules` has registered. |
| `onSuccess` | `false` | `function($form)` on a passing submit. Return `false` to stop submission. |
| `onError` | `false` | `function($form)` on a failing submit. |
| `onElementValidate` | `false` | `function(valid, $input, $form, errorMsg)` after each field is validated. |

### Validate On Event ###
You can cause an element to be validated upon the firing of an event, by attaching an attribute to the form input element named `data-validation-event="click"`. When the configuration settings have `validateOnEvent : true`, the click event will trigger the onBlur validaton for that element. Possible use case: Checkboxes. Instead of waiting for the checkbox to lose focus (blur) and waiting for a validation to occurr, you can specify that elements validation should occur as soon as that checkbox element is clicked.

## Localization

English is built in, and 20 translations are bundled:

| Code | Language | Code | Language | Code | Language | Code | Language |
| ---- | -------- | ---- | -------- | ---- | -------- | ---- | -------- |
| `ar` | Arabic | `ca` | Catalan | `cs` | Czech | `da` | Danish |
| `de` | German | `es` | Spanish | `fa` | Persian | `fr` | French |
| `it` | Italian | `ka` | Georgian | `ko` | Korean | `nl` | Dutch |
| `no` | Norwegian | `pl` | Polish | `pt` | Portuguese | `ro` | Romanian |
| `ru` | Russian | `sv` | Swedish | `tr` | Turkish | `vi` | Vietnamese |

```js
$.validate({ lang: 'sv' });          // fetched at runtime
```

```js
import 'jquery-form-validator/lang/sv';   // or registered up front, no request
```

You can also override individual messages with the `language` option instead of loading a file — see
[Messages and localisation](#messages-and-localisation) for the 3.0 sentence templates and plural
forms. Here you can read more about [localization](http://formvalidator.net/#localization)

# Default validators

### Answer length (required)

```
<!-- Require an answer (can be applied to all types of inputs and select elements) -->
<input type="text" data-validation="required">
<input type="checkbox" name="agreement" data-validation="required">
<select name="answer" data-validation="required">
  <option value=""> - - Answer - - </option>
  <option>Yes</option>
  <option>No</option>
</select>

<!-- Max 100 characters -->
<input type="text" data-validation="length" data-validation-length="max100">

<!-- Minimum 20 characters -->
<input type="text" data-validation="length" data-validation-length="min20">

<!-- No less than 50 characters and no more than 200 characters -->
<input type="text" data-validation="length" data-validation-length="50-200">

<!-- Require that atleast 2 options gets choosen -->
<select multiple="multiple" size="5" data-validation="length" data-validation-length="min2">
  <option>A</option>
  <option>B</option>
  <option>C</option>
  <option>D</option>
  <option>E</option>
</select>
```
This plugin also supports the attributes "required" and "maxlength" by using the Html5 module.

### Numbers
```
<!-- Any numerical value -->
<input type="text" data-validation="number">

<!-- Only allowing float values -->
<input type="text" data-validation="number" data-validation-allowing="float">

<!-- Allowing float values and negative values -->
<input type="text" data-validation="number" data-validation-allowing="float,negative">

<!-- Validate float number with comma separated decimals -->
<input type="text" data-validation="number" data-validation-allowing="float" 
		 data-validation-decimal-separator=",">

<!-- Only allowing numbers from 1 to 100 -->
<input type="text" data-validation="number" data-validation-allowing="range[1;100]">

<!-- Only allowing numbers from -50 to 30 -->
<input type="text" data-validation="number" data-validation-allowing="range[-50;30],negative">

<!-- Only allowing numbers from 0.05 to 0.5 -->
<input type="text" data-validation="number" data-validation-allowing="range[0.05;0.5],float">
You can also define the decimal separator when initializing the validation.

<p>
    <strong>Average points</strong><br>
    <input type="text" data-validation="number" data-validation-allowing="float">
  </p>
  ....
</form>
<script>
  $.validate({
    decimalSeparator : ','
  });
</script>
```
Inputs of type "number" will also become validated by loading the html5 module.

### E-mail
```
<input type="text" data-validation="email">
```
Inputs of type "email" will also become validated by loading the html5 module.

### URL:s

```
<input type="text" data-validation="url">
```
Inputs of type "url" will also become validated by loading the html5 module.

### Date

```
<!-- Validate date formatted yyyy-mm-dd -->
<input type="text" data-validation="date">

<!-- Validate date formatted yyyy-mm-dd but dont require leading zeros -->
<input type="text" data-validation="date" data-validation-require-leading-zero="false">

<!-- Validate date formatted dd/mm/yyyy -->
<input type="text" data-validation="date" data-validation-format="dd/mm/yyyy">
```

See the date module for further validators.

### Alphanumeric

```
<!-- This input requires an answer that contains only letters a-z and/or numbers -->
<input type="text" data-validation="alphanumeric">

<!-- This input requires the same as the one above but it also allows hyphen and underscore -->
<input type="text" data-validation="alphanumeric" data-validation-allowing="-_">
```
If you want to allow any kind of letters (not only A-Z) you're looking for the letternumeric validator.

### Checkboxes Group
Validate qty of checkboxes in a group (same name) have been checked, using min, max or range. Only the first checkbox element in the group needs to have the validation attributes added.
```
<!-- Require checkboxes in this group, min1 -->
<input type="checkbox" name="newsletters[]" data-validation="checkbox_group" data-validation-qty="min1">
<!-- Require checkboxes in this group, max3 -->
<input type="checkbox" name="newsletters[]" data-validation="checkbox_group" data-validation-qty="max3">
<!-- Require checkboxes in this group, min1, max4 -->
<input type="checkbox" name="newsletters[]" data-validation="checkbox_group" data-validation-qty="1-4">
If your checkboxes group is generated by a server-side script and you don't want to add the validation attributes to each input element, you can use this javascript snippet before calling the validatorLoad() function

<!-- Add validation attributes to first input element in
 checkboxes group, before loading validator -->
<script>
$("[name='newsletters[]']:eq(0)")
  .valAttr('','validate_checkbox_group')
  .valAttr('qty','1-2')
  .valAttr('error-msg','chose 1, max 2');
</script>
Regexp
<!-- This input would only allow lowercase letters a-z -->
<input type="text" data-validation="custom" data-validation-regexp="^([a-z]+)$">
```

This plugin also supports the attribute "pattern" by using the Html5 module.

### Character count down
```
<p>
    History (<span id="maxlength">50</span> characters left)
    <textarea rows="3" id="area"></textarea>
  </p>
<script>
  $('#area').restrictLength($('#maxlength'));
</script>
```
### Make validation optional
```
<!-- This input will only be validated if a value is given -->
<input type="text" data-validation="url" data-validation-optional="true">
```
You can also use the logic module if you want the validation of an input depend on another input having a value.

### Display help text
It is possible to display help information beside each input. The text will fade in when the input gets focus on and fade out when the input looses focus. The container for the help text will have the class form-help. If you don't want this feature you can read the setup guide on how to disable it.

```
<form action="" id="some-form">
    <p>
      <strong>Why not?</strong>
      <input name="why" data-validation-help="Please give us some more information">
    </p>
    ...
  </form>
  ```
### Validate inputs when blurred

By default each input will become validated immediately when the input looses focus. If you don't want this feature you can read the setup guide on how to disable it.

### Input suggestions
There are two ways you can give suggestions to the user while the user types.

1) Using attribute data-suggestions

```
<p>
    What's your favorite color?
    <input name="color" data-suggestions="White, Green, Blue, Black, Brown">
  </p>
  ...
</form>
```
2) Using $.formUtils.suggest()
```
<script>
  var largeArray = [];
  largeArray.push('Something');
  largeArray.push('Something else');
  ...

  $.formUtils.suggest( $('#the-input'), largeArray );
</script>
```
This plugin also supports the data-list element by using the Html5 module.

Ignoring characters
You can tell any validator to ignore certain characters by using the attribute data-validation-ignore (comma separated list).
```
<p>
  How much do you want to donate?
  <!-- Make it optional to end the amount with a dollar-sign -->
  <input name="color" data-validation="number" data-validation-ignore="$">
</p>
```

## Security validators<

### Password confirmation

This validator can be used to validate that the values of two inputs are the same. The first input should have a name suffixed with <em>_confirmation</em> and the second should have the same name but without the suffix.

```
<p>
    Password (at least 8 characters)
    <input name="pass_confirmation" data-validation="length" data-validation-length="min8">

    Confirm password
    <input name="pass" data-validation="confirmation">
</p>
```

```
<p>
    E-mail
    <input name="user-email" data-validation="email" />

    Repeat e-mail
    <input name="repeat" data-validation="confirmation" data-validation-confirm="user-email" />
</p>
```

### Password strength

Use this validator to make sure that your user has a strong enough password. Set attribute <code>data-validation-strength</code> to 1, 2 or 3 depending on how strong a password you require.

**The scoring changed in 3.0** and is now length-driven rather than composition-driven — see [Passwords](#passwords) for what moved and why. Consider pairing it with <code>data-validation="breached"</code>.

If you want the strength of the password to be displayed while the user types you call <code>displayPasswordStrength()</code> in the end of the form.

```
<form action="">
    <p>
        <strong>Password:</strong>
        <input name="pass" type="password" break=""
                data-validation="strength" break="" data-validation-strength="2">
    </p>
    ...
</form>

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery-form-validator/2.3.26/jquery.form-validator.min.js"></script>
<script>
$.validate({
    modules : 'security',
    onModulesLoaded : function() {
        var optionalConfig = {
            fontSize: '12pt',
            padding: '4px',
            bad : 'Very bad',
            weak : 'Weak',
            good : 'Good',
            strong : 'Strong'
        };

        $('input[name="pass"]').displayPasswordStrength(optionalConfig);
    }
});
</script>
```

### Server side validation

By using this validator you can validate the value given by the user on the server before the form gets submitted. The validation function will send a POST request to the URL declared in <code>data-validation-url</code>. The argument posted to the URL will have the same name as the input being validated.

The form will get the class <em>validating-server-side</em> while the server is being requested.

The response from the validation script must be a JSON formatted object, containing the properties "valid" and "message".

```
{
    "valid" : true|false,
    "message" : "String with text that should be displayed as error message"
}
```

#### Form

```
<form action="">
    <p>
        <strong>User name:</strong>
        <input name="user" data-validation="server" data-validation-url="/validate-input.php">
    </p>
    ...
</form>
```

#### /validate-input.php

```
<?php
$response = array(
    'valid' => false,
    'message' => 'Post argument "user" is missing.'
);

if( isset($_POST['user']) ) {
    $userRepo = new UserRepository( DataStorage::instance() );
    $user = $userRepo->loadUser( $_POST['user'] );

    if( $user ) {
        // User name is registered on another account
        $response = array('valid' => false, 'message' => 'This user name is already registered.');
    } else {
        // User name is available
        $response = array('valid' => true);
    }
}
echo json_encode($response);
```

**Modifying the server request**

The parameter containing the input value, sent to the server, will by default have the same name as the input. You can however set your own parameter name by using the attribute <code>data-validation-param-name</code>. You can also send along other parameters to the server by using the attribute <code>data-validation-req-params</code>.

```
<?php
  $json = json_encode(array('user'=>$user->get('ID')));
?>
<p>
  <strong>E-mail:</strong>
  <input type="email" name="check-email" data-validation="server"
              data-validation-url="/validate-form-input.php"
              data-validation-param-name="email"
              data-validation-req-params="<?php echo $json ?>" />
</p>
```

### Credit card validation

This validator makes it possible to validate any of the credit cards VISA, Mastercard, Diners club, Maestro, CJB, Discover and American express

```
<-- Accept credit card number from Visa, Mastercard and American Express -->
<p>
    Credit card number
    <input data-validation="creditcard" data-validation-allowing="visa, mastercard, amex" />
</p>
<p>
    Security code (cvv)
    <input name="cvv" data-validation="cvv" />
</p>
```

You can also let the user choose a credit card and programmatically change the allowed credit card on the input of the card number.

```
<p>
    Credit card
    <select name="credit-card" id="credit-card">
        <option value="visa">VISA</option>
        <option value="mastercard">Mastercard</option>
        <option value="amex">American express</option>
        <option value="diners_club">Diners club</option>
        <option value="discover">Discover</option>
        <option value="cjb">CJB</option>
        <option value="maestro">Maestro</option>
    </select>
</p>
<p>
    Credit card number
    <input name="creditcard_num" data-validation="creditcard" data-validation-allowing="visa" />
</p>
...
</div>
<script>
$.validate({
    modules : 'security',
    onModulesLoaded : function() {
        // Bind card type to card number validator
        $('#credit-card').on('change', function() {
            var card = $(this).val();
            $('input[name="creditcard_num"]').attr('data-validation-allowing', card);
        });
    }
});
</script>
```

### Simple captcha

```
<?php
session_start();
if( isset($_POST['captcha']) && isset($_SESSION['captcha'])) {
    if( $_POST['captcha'] != ($_SESSION['captcha'][0]+$_SESSION['captcha'][1]) ) {
        die('Invalid captcha answer');  // client does not have javascript enabled
    }
    // process form data
    ...
}
$_SESSION['captcha'] = array( mt_rand(0,9), mt_rand(1, 9) );
?>
<form action="">
    <p>
        What is the sum of <?=$_SESSION['captcha'][0]?> + <?=$_SESSION['captcha'][1]?>?
        (security question)
        <input name="captcha" data-validation="spamcheck"
                    data-validation-captcha="<?=( $_SESSION['capthca'][0] + $_SESSION['captcha'][1] )?>"/>
    </p>
    <p><input type="submit" /></p>
</form>
```

### Google reCAPTCHA

Use this validator if wanting to integrate the Google service reCAPTCHA.

``` 
<p>
    <input  data-validation="recaptcha" data-validation-recaptcha-sitekey="[RECAPTCHA_SITEKEY]">
</p>
```

You can also use the setup function to configure the recaptcha service.

```
$.validate({
    reCaptchaSiteKey: '...',
    reCaptchaTheme: 'light'
});
```

### Letters and numbers

By using the validator <code>letternumeric</code> you can validate that given input value only contains letters and/or numbers. This validator allows any type of character in contrast to the <a href="#default-validators_alphanumeric">alphanumeric</a> validator, which only allows letters A-Z.

```
<!-- This input requires an answer that contains only letters and/or numbers -->
<input type="text" data-validation="letternumeric">

<!-- This input requires the same as the one above but it also allows hyphen and underscore -->
<input type="text" data-validation="alphanumeric" data-validation-allowing="-_">
```

## Date validators

### Birthdate

This validator is the same as the default <a href="#default-validators_dates">date validator</a> except that it only allows past dates and dates that is not older than 120 years.

```
<!-- Validate birth date formatted yyyy-mm-dd -->
<input type="text" data-validation="birthdate">

<!-- Validate birthdate formatted yyyy-mm-dd but dont require leading zeros -->
<input type="text" data-validation="birthdate" data-validation-require-leading-zero="false">

<!-- Validate birth date formatted dd/mm/yyyy -->
<input type="text" data-validation="birthdate" data-validation-format="dd/mm/yyyy">
```

## Time

```
<!-- Validate time formatted HH:mm -->
<input type="text" data-validation="time">
```


## Location validators

### Country

```
<!-- Validate country (english only) -->
<input type="text" data-validation="country"/>
```

### State (US)

```
<!-- Validate US state -->
<input type="text" data-validation="federatestate"/>
```

### Longitude and Latitude

```
<!-- Validate longitude and latitude (eg 40.714623,-74.006605) -->
<input type="text" data-validation="longlat"/>
```

### Suggest country/state

By using this function you'll make it easier for your visitor to input a country or state.

```
    <form action="">
        ...
        <p>
            <strong>Which country are you from?</strong>
            <input name="user_country" data-validation="country"/>
        </p>
        <p>
            <strong>Which state do you live in?</strong>
            <input name="user_home_state" data-validation="federatestate"/>
        </p>
    </form>
</div>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery-form-validator/2.3.26/jquery.form-validator.min.js"></script>
<script>
$.validate({
    modules : 'location',
    onModulesLoaded : function() {
        $('input[name="user_country"]').suggestCountry();
        $('input[name="user_home_state"]').suggestState();
    }
});
</script>
```

## File validators

### File size

This validation is only supported by Internet Explorer 10, Mozilla FireFox v >= 3.6 and any of the later versions of webkit based browsers.

```
<!-- Validate that file isn't larger than 512 kilo bytes -->
<input type="file" data-validation="size" data-validation-max-size="512kb" />

<!-- Validate that file isn't larger than 3 mega bytes -->
<input type="file" data-validation="size" data-validation-max-size="3M" />
```

### File type

This validation will fall back on checking the file extension in older browsers. In modern browsers the validation will check that any of the extensions in <code>data-validation-allowing</code> exists in the mime type declaration of the file. This means that <code>data-validation-allowing="pdf"</code> will work in both modern browsers (checking against "application/pdf") and older browsers (checking the file extension ".pdf").

```
<!-- Validate that file is an image of type JPG, GIF or PNG and not larger than 2 mega bytes -->
<input type="file" data-validation="mime size" break0="" data-validation-allowing="jpg, png, gif" break=""
       data-validation-max-size="2M" />

<!-- Validate that a file is given and that it has .txt as extension -->
<input type="file" data-validation="required extension" data-validation-allowing="txt" />
```

Validating multiple files (with separate error messages depending on failed validation):

```
<input type="file" multiple="multiple" name="images"
    data-validation="length mime size"
    data-validation-length="min2"
    data-validation-allowing="jpg, png, gif"
    data-validation-max-size="512kb"
    data-validation-error-msg-size="You can not upload images larger than 512kb"
    data-validation-error-msg-mime="You can only upload images"
    data-validation-error-msg-length="You have to upload at least two images"
    />
```

### Image dimension and ratio

Use the validator <code>dimension</code> to check the dimension of an image (jpg, gif or png).

```
<!-- Validate that the image is no smaller than 100x100px -->
<input data-validation="dimension mime" data-validation-allowing="jpg" break="" data-validation-dimension="min100" />

<!-- Validate that the image is no smaller than 300x500 px (width/height) -->
<input data-validation="dimension mime" data-validation-allowing="jpg" break="" data-validation-dimension="min300x500" />

<!-- Validate that the image is no larger than 500x1000 px -->
<input data-validation="dimension mime" data-validation-allowing="jpg" break="" data-validation-dimension="max500x1000" />

<!-- Validate that the image is no smaller than 100x100 px and no larger than 800x800 -->
<input data-validation="dimension mime" data-validation-allowing="jpg" break="" data-validation-dimension="100-800" />

<!-- Validate that the image is no smaller than 200x400 px and no larger than 600x1200 -->
<input data-validation="dimension mime" data-validation-allowing="jpg" break="" data-validation-dimension="200x400-600x1200" />
```

Use the attribute <code>data-validation-ratio</code> to validate that the uploaded image has a certain ratio

```
<!-- Validate that only square images gets uploaded -->
<input data-validation="ratio mime" data-validation-allowing="jpg, png, gif" break="" data-validation-dimension="min100" data-validation-ratio="1:1" />

<!-- Validate that only somewhat square images gets uploaded -->
<input data-validation="ratio mime" data-validation-allowing="jpg" break="" data-validation-dimension="min100" data-validation-ratio="8:10-12:10" />
```

## Logic

### Validators depending on each other

Use the attributes <code>data-validation-depends-on</code> to configure that an input is optional as long as another input is left without an answer.

```
<!-- Require e-mail only if checkbox is checked -->
<p>
    <strong>Contact me:</strong>
    <input name="do-contact" type="checkbox" value="1" />
</p>
<p>
    <strong>E-mail:</strong>
    <input
           type="text"
           data-validation="email"
           data-validation-depends-on="do-contact"
    />
</p>
```

```
<!-- Require a state to be given if the user comes from either USA or Canada -->
<p>
    <strong>Country:</strong>
    <input
           type="text"
           name="country"
           id="country-input"
           data-validation="country"
    />
</p>

<p>
    <strong>State:</strong>
    <input type="text"
           name="state" break=""
           data-validation="required" break1=""
           data-validation-depends-on="country" break2=""
           data-validation-depends-on-value="usa, canada"
    />
</p>
</div>
...
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery-form-validator/2.3.26/jquery.form-validator.min.js"></script>
<script>
$.validate({
    modules : 'location, logic',
    onModulesLoaded : function() {
        $('#country-input').suggestCountry();
    }
});
</script>
```

### Require only one out of several inputs

Use the attribute <code>data-validation-optional-if-answered</code> to tell the validator that only one, out of a group of inputs, requires an answer.

```
<p>
    <strong>Home phone number:</strong>
    <input name="home-phone"
           data-validation="number" break=""
            data-validation-optional-if-answered="cell-phone, work-phone" />
</p>
<p>
    <strong>Cell phone number:</strong>
    <input name="cell-phone"
           data-validation="number" break=""
            data-validation-optional-if-answered="home-phone, work-phone" />
</p>
<p>
    <strong>Work phone number:</strong>
    <input name="work-phone"
           data-validation="number" break=""
            data-validation-optional-if-answered="home-phone, cell-phone" />
</p>
</div>
```

## Changelog

#### 3.0.0

Full detail in [What's new in 3.0](#whats-new-in-30). In brief:

**Breaking**
- `data-validation="strength"` is rescored on length rather than composition, following NIST SP 800-63B rev 4. Values that passed before may now fail. See [Passwords](#passwords).
- `dist/` replaces `form-validator/` as the canonical output path. `form-validator/` is kept in step for one major version.

**Added**
- ES module build (`dist/esm/`), UMD build, subpath exports and bundled TypeScript declarations.
- Accessibility: `aria-invalid`, `aria-describedby`, `aria-live` messages, `role="alert"` summary, focus management on failed submit, and reduced-motion support. WCAG AA contrast fix in the bundled theme.
- Module `native` — bridges the Constraint Validation API so `element.validity`, `form.checkValidity()` and `:invalid` agree with your rules.
- `bootstrap: 4` / `bootstrap: 5` — opt-in class-name preset emitting `is-invalid`, `is-valid`, `invalid-feedback` and `form-text` instead of the Bootstrap 3 names. Bootstrap 3 remains the default. Fixes messages on `.input-group` fields, which Bootstrap 4/5 rendered permanently invisible. See [Bootstrap 4 and 5](#bootstrap-4-and-5).
- `data-validation="breached"` — screens passwords against Have I Been Pwned over k-anonymity. Opt-in.
- Whole-sentence message templates with `{0}` placeholders and `Intl.PluralRules` plural forms. All 20 bundled languages carry templates.
- `localeNumberFormat` sanitizer, and `decimalSeparator: 'auto'`.
- New options: `focusOnError`, `novalidate`, `preferNativeValidation`, `observeDynamicFields`. See [Fully customizable](#fully-customizable).
- Async validation is debounced via `data-validation-debounce`, and no longer disables the field while a request is in flight.
- Public helpers: `$.formUtils.a11y`, `formatMessage`, `selectPluralForm`, `locale`.

**Fixed**
- Internationalised domains (IDN A-labels) were rejected, which also broke URL validation.
- The CVV validator never received the card type, so amex-only forms rejected valid four digit codes.
- `1.0236` was accepted as an integer when `decimal-separator` was `,`.
- A date format without a day, such as `mm/yyyy`, was always invalid.
- `errorMessageTemplate` was documented in 2.x but never read; the summary markup was hardcoded.
- Live re-validation moved from `keyup` to `input`, so paste, autofill, drag-and-drop, speech input and IME composition now clear a stale error.
- `numberFormat` no longer throws `ReferenceError` when numeral.js is absent.

**Deprecated**
- `data-validation="complexity"` — use `strength`, ideally with `breached`.
- `$.fn.validateOnKeyUp` / `$.fn.removeKeyUpValidation` — use `validateOnInput` / `removeInputValidation`.

**Removed**
- The `placeholder` and `datalist` shims for pre-HTML5 browsers.
- The IE7 `onreadystatechange` branch in the module loader.

**Tooling**
- Travis replaced by GitHub Actions: Node 20 and 22 against jQuery 1.12.4, 2.2.4, 3.7.1 and 4.0.0, plus `publint` and `attw`.
- JSHint replaced by ESLint with a flat config.

#### 2.3.19
- New translations (Polish, Romanian, Danish, Norwegian, Dutch, Czech, Russian, Italian)
- Several improvements made to already existing translations
- "Validation help" no longer puts constraints on input names
- Improved confirmation validation
- Config parameter `errorMessagePosition` is now only used to point out where error message should be placed. New configuration parameters is introduced that handles custom positioning of error messages [#226](https://github.com/victorjonsson/jQuery-Form-Validator/issues/226#issuecomment-191233456)
- Now possible to add `data-validation-ignore` to filter out certain characters before validation
- New sanitation method `strip` that removes defined characters
- Now possible to declare attributes not prefixed with data-validation in jsconf module
- All inputs gets sanitized on page load when using sanitation module
- Allow dates to omit leading zero using `data-validation-require-leading-zero="false"`
- Module toggleDisabled now acts on value change, not only mouse click
- `data-validation-if-checked` now deprecated, use `data-validation-depends-on` instead [#153](https://github.com/victorjonsson/jQuery-Form-Validator/issues/153)
- Event `beforeValidation` now gets value, language and configuration as arguments and can be used to prevent validation of the input.
- Security module now has a `recaptcha` validator that uses Google reCaptcha 2
- The plugin is installable using npm (also possible to require validation modules when using browserify)
- Polish validation module
- Brazilian validation module
- UK validation module now also have validators `uknin` `ukutr`
- Sepa-module that makes it possible to validate sepa, iban and bic.
- New module named "logic" containing the features `data-validation-depends-on` and `data-validation-optional-if-answered`

#### 2.2.8
- The plugin is now again possible to install via bower.
- Portoguese language pack and validators
- New module used for data-sanitiation
- E-mail addresses now validated in accordance to rfc 6531
- Now possible to use $.fn.validate to programmatically validate inputs
- Hidden inputs won't get validated by default (can be overriden using option validateHiddenInputs)


#### 2.2.43
- Fixed min/max parse error in HTML5 module
- Now also supports Twitter bootstraps horizontal forms
- This plugin now also distributes a default CSS theme including success/fail icons (used on formvalidator.net)
- Email validation now won't fail if email begins with a number
- This plugin now comes with error dialogs translated to English, French, German, Spanish and English.
- New validator `letternumeric`. Validates that input consists out of any type of letter (not only alphanumeric) and/or numbers
- You can now validate image dimension and ratio
- ... and a bunch of other smaller bug fixes and improvements.

#### 2.2.0
* Now possible to define an error message for each validation rule on a certain input (issue #113)
* This plugin now serves as a html5 fallback. You can now use the native attributes to declare which type
of validation that should be applied.
* Use a template for error messages when having errorMessagePosition set to top
* Added validation of credit card number and CVV to the security module
* Event onElementValidate added
* Use the attribute data-validation-confirm to declare which input that should be confirmed when using validation=confirmation (issue #112)
* Validation "required" now supports inputs of type radio
* $.validateForm is now deprecated, use $.isValid instead
* Possible to check if form is valid programmatically without showing error messages
* Select elements can now be validated server-side
* Cleaned up dialog messages
* Various IE8 fixes
* Possible to send along parameters to the server when using server side validation
* Now possible to set your own parameter name when using server side validation
* Improved/simplified URL validation
* ... and a whole lot more small improvements

#### 2.1.47
* Incorrect error-styling when using datepicker or suggestions is now fixed
* Incorrect error-styling of select elements is now fixed
* Deprecated function $.validationSetup is now removed, use $.validate() instead
* You can now return an array with errors using the event `onValidate`
* You can now declare an element where all error messages should be placed (config.errorMessagePosition)

#### 2.1.36
* Now possible to use the native reset() function to clear error messages and error styling of the input elements

#### 2.1.34
* General improvements and bug fixes
* Added events "beforeValidation" and "validation" (see http://formvalidator.net/#configuration_callbacks for more info)

#### 2.1.27
 * E-mail validation support .eu top domain
 * Improvements in server validation
 * Now possible to re-initiate the validation. This makes it possible to dynamically change the form and then call $.validate() again to refresh the validation (issue #59)
 * Number validation now supports range

#### 2.1.15
 * E-mail addresses can now contain + symbol
 * Correction of the US states in validation "federatestate"
 * Fixed bug in server validation

#### 2.1.09
 * File validation now support multiple files
 * Length validation can now be used to validate the number of uploaded files using a file input that supports multiple files
 * Validation classes is no longer applied on inputs that for some reason shouldn't become validated

#### 2.1.08
 * Now possible to configure the decimal separator when validating float values. Use either the
 attribute *data-validation-decimal-separator* or the property *decimalSeparator* when
calling $.validate()
 * $.validationSetup is renamed to $.validate. You will still be able to initiate the validation by calling
 the $.validationSetup but it's considered deprecated.

#### 2.1.06
 * Modules can now be loaded from remote websites

#### 2.1.05
 * Fixed language bug (issue #43 on github)
 * Validation on server side is now triggered by the blur event
 * Now using class names that's compliant with twitter bootstrap 3.x

#### 2.1
 * Code refactoring and some functions renamed
 * Validator "checkbox_group" added

#### 2.0.7
 * Now possible to validate file size, extension and mime type (using the file module)

#### 2.0
 * [min|max]_length is removed (now merged with length validation).
 * The number, int and float validation is merged together, all three variants is now validated by the number validation.
 * Phone validation is moved to "sweden" module and renamed to swephone.
 * The attribute to be used when defining the regular expression for custom validations is now moved to its own attribute (data-validation-regexp)
 * Length validation now looks at attribute data-validation-length (eg. min5, max200, 3-12).
 * The validation rule no longer needs to be prefixed with "validate_" (it's still possible to use the prefix but it's considered deprecated).
 * Some validation functions is moved to modules (see the function reference over at http://formvalidator.net).
 * Added function $.validationSetup() to reduce the amount of code that has to be written when initiating the form validation.


## Development and Testing

The suite runs on Node 18 and later (`engines.node` is `>=18`). CI tests Node 20 and 22 against jQuery
1.12.4, 2.2.4, 3.7.1 and 4.0.0.

### Installation

To install all dependencies:
```bash
npm install
```

The test suite runs QUnit in headless Chrome through Puppeteer. Puppeteer resolves its own downloaded
browser; set `CHROME_BIN` or `PUPPETEER_EXECUTABLE_PATH` to point at a different one.

### Running the Test Suite

Unit tests are executed in a headless Chrome environment using QUnit and Puppeteer:
```bash
npx grunt test
```

Or run the default task to start a local test server and watch for file changes:
```bash
npx grunt
```

### Linting

```bash
npm run lint
```

### Building the Project

```bash
npx grunt build
```

`build` runs `concat` → `copy` → `umd` → `cssmin` → `esm` → `dist`: it concatenates the main files (with
`core-validators.js` last, since it registers rules against the utilities defined before it), copies the
modules and language files, wraps everything in UMD, minifies the CSS, writes the ES module build to
`dist/esm/`, and mirrors the result into `dist/`.

**`build` does not minify the JavaScript.** Minification is the separate `uglify` task, and because the
`dist` mirror step runs before it, `dist` has to be re-run afterwards to pick the minified files up:

```bash
npx grunt build && npx grunt uglify dist
```

Without the second command `jquery.form-validator.min.js` is emitted byte-identical to the unminified
file. `uglify` minifies every built `.js` in place except `jquery.form-validator.js`, which is kept
readable alongside its `.min.js`.

| Task | What it does |
| ---- | ------------ |
| `grunt build` | Everything except minification (see above). |
| `grunt uglify` | Minify the built JavaScript under `form-validator/`. |
| `grunt dist` | Mirror `form-validator/` into `dist/`. |
| `grunt test` | `build`, then ESLint, then the QUnit suite. |
| `grunt prepublish` | `test` then `uglify`. |
| `grunt version` | Bump the version; pass `--new-version=3.1.0` to set one. Rebuild afterwards. |
| `grunt clean` | Delete `form-validator/` and `dist/`. |


## Credits

http://www.formvalidator.net/#credits
