// Type definitions for jquery-form-validator 3.x
// Project: http://formvalidator.net/
//
// Hand written rather than generated: the source is plain JavaScript, and the
// plugin exports nothing -- it augments the jQuery namespace as a side effect.
// Importing it for its types therefore means importing it for its behaviour too.
//
// This is a global script declaration file, not a module, so the interfaces
// below merge directly with the ones from @types/jquery.

/// <reference types="jquery" />

/**
 * Where an error message is placed relative to the field it belongs to.
 *
 * "inline" renders a message next to each field; "top" renders a single
 * summary above the form. A function is treated the same as "top".
 */
type JfvErrorMessagePosition = 'inline' | 'top' | ((...args: any[]) => any);

/** Strings used to build the error summary. */
interface JfvErrorMessageTemplate {
  container?: string;
  messages?: string;
  field?: string;
  /** Used when there is no input to link the message to. */
  fieldNoLink?: string;
}

/** A single message returned from the onValidate callback. */
interface JfvValidationError {
  element: JQuery;
  message: string;
}

interface JfvValidationConfig {
  /** Form selector or element. Defaults to "form". */
  form?: string | JQuery | Element;

  /** Names of inputs to skip even when they carry a validation rule. */
  ignore?: string[];

  /** Comma separated list of modules to load, e.g. "security, date". */
  modules?: string;

  /** ISO 639-1 language code; loads the matching language file. */
  lang?: string;

  /** Overrides for individual language strings. */
  language?: Partial<JfvLanguageStrings> | false;

  // --- Display ------------------------------------------------------------

  errorElementClass?: string;
  successElementClass?: string;
  /** Empty string leaves the border colour alone. */
  borderColorOnError?: string;
  errorMessageClass?: string;
  errorMessagePosition?: JfvErrorMessagePosition;
  errorMessageTemplate?: JfvErrorMessageTemplate;
  inputParentClassOnError?: string;
  inputParentClassOnSuccess?: string;
  /**
   * Extra class placed on an inline error message for the CSS framework to
   * style. Defaults to "help-block" (Bootstrap 3); the bootstrap 4/5 preset
   * sets it to "invalid-feedback". Added in 3.0.
   */
  inlineErrorMessageClass?: string;
  /**
   * Extra class placed on data-validation-help text. Defaults to "help-block"
   * (Bootstrap 3); the bootstrap 4/5 preset sets it to "form-text".
   * Added in 3.0.
   */
  helpTextClass?: string;
  /**
   * Which Bootstrap release the page uses, so the matching class names are
   * emitted. Falsy (the default) keeps the Bootstrap 3 era names this plugin
   * has always shipped. Accepts a major version or a full one ("5.3.3").
   * Options passed explicitly always win over the preset. Added in 3.0.
   */
  bootstrap?: 3 | 4 | 5 | string | false;
  /** Apply the success class even to inputs that carried no rule. */
  addValidClassOnAll?: boolean;

  /** Scroll the window to the form when submit validation fails. */
  scrollToTopOnError?: boolean;

  /**
   * Move focus to the error summary, or to the first invalid input, when
   * submit validation fails. Added in 3.0; defaults to true.
   */
  focusOnError?: boolean;

  // --- Behaviour ----------------------------------------------------------

  validateOnBlur?: boolean;
  validateOnEvent?: boolean;
  validateCheckboxRadioOnClick?: boolean;
  validateHiddenInputs?: boolean;
  showHelpOnFocus?: boolean;
  addSuggestions?: boolean;

  /**
   * Add novalidate to the form so the browser does not raise its own error
   * bubbles over the plugin's messages. Added in 3.0; defaults to true.
   * A novalidate attribute already present in the markup is never removed.
   */
  novalidate?: boolean;

  /**
   * With the "native" module loaded, let the browser answer type, min, max,
   * step and pattern instead of translating them into this plugin's own
   * validators. Added in 3.0; defaults to false.
   */
  preferNativeValidation?: boolean;

  /**
   * Watch the form with a MutationObserver and wire up fields added after
   * $.validate() ran. Added in 3.0; defaults to false.
   */
  observeDynamicFields?: boolean;

  // --- Parsing ------------------------------------------------------------

  dateFormat?: string;
  decimalSeparator?: string;

  /** Sanitize every input in the form, not only those with data-sanitize. */
  sanitizeAll?: boolean;

  // --- Attribute names ----------------------------------------------------

  validationRuleAttribute?: string;
  validationErrorMsgAttribute?: string;

  // --- Callbacks ----------------------------------------------------------

  /** Return false to stop the form from being submitted. */
  onSuccess?: (($form: JQuery) => boolean | void) | false;
  onError?: (($form: JQuery) => void) | false;
  onElementValidate?: ((isValid: boolean, $el: JQuery, $form: JQuery, errorMsg: string) => void) | false;

  /** Extra whole-form checks run after every field has been validated. */
  onValidate?: ($form: JQuery) => JfvValidationError | JfvValidationError[] | void;
  onModulesLoaded?: (() => void) | null;

  /**
   * Return the element that should hold a field's inline message, or a falsy
   * value to take over rendering entirely.
   */
  inlineErrorMessageCallback?: (($input: JQuery, errorMsg: string | false, config: JfvValidationConfig) => JQuery | false) | false;

  /**
   * Return the element that should hold the error summary, or a falsy value
   * to take over rendering entirely.
   */
  submitErrorMessageCallback?: (($form: JQuery, errorMessages: string[] | false, config: JfvValidationConfig) => JQuery | false) | false;

  [option: string]: any;
}

/** The result of validating a single field. */
interface JfvValidationResult {
  isValid: boolean;
  /** False when the field was skipped, or is waiting on an async validator. */
  shouldChangeDisplay: boolean;
  errorMsg: string;
}

interface JfvValidator {
  /** Rule name as written in data-validation, without the "validate_" prefix. */
  name: string;

  /**
   * Return true or false, or null to signal that no verdict is available yet
   * and that the validator will re-trigger validation once it is.
   */
  validatorFunction: (
    value: string,
    $el: JQuery,
    config: JfvValidationConfig,
    language: JfvLanguageStrings,
    $form: JQuery,
    eventContext?: string
  ) => boolean | null;

  errorMessage?: string;
  /** Key into the language object, or a function returning one. */
  errorMessageKey?: string | ((config: JfvValidationConfig) => string);

  /**
   * Set false to skip this rule while the user is still editing.
   * Replaces validateOnKeyUp, which still works but is deprecated.
   */
  validateOnInput?: boolean;
  /** @deprecated since 3.0, use validateOnInput */
  validateOnKeyUp?: boolean;
}

interface JfvAsyncValidator extends Omit<JfvValidator, 'validatorFunction'> {
  /** Call done(true) or done(false) once the answer is known. */
  validatorFunction: (
    done: (isValid: boolean) => void,
    value: string,
    $el: JQuery,
    config: JfvValidationConfig,
    language: JfvLanguageStrings,
    $form: JQuery,
    eventContext?: string
  ) => void;
}

interface JfvSanitizer {
  /** Name as written in data-sanitize. */
  name: string;
  sanitizerFunction: (value: string, $input: JQuery, config: JfvValidationConfig) => string;
}

/** Message strings. Every key may be overridden through config.language. */
interface JfvLanguageStrings {
  errorTitle: string;
  requiredField: string;
  requiredFields: string;
  badTime: string;
  badEmail: string;
  badTelephone: string;
  badSecurityAnswer: string;
  badDate: string;
  lengthBadStart: string;
  lengthBadEnd: string;
  lengthTooLongStart: string;
  lengthTooShortStart: string;
  notConfirmed: string;
  badDomain: string;
  badUrl: string;
  badCustomVal: string;
  andSpaces: string;
  badInt: string;
  badSecurityNumber: string;
  badUKVatAnswer: string;
  badStrength: string;
  badNumberOfSelectedOptionsStart: string;
  badNumberOfSelectedOptionsEnd: string;
  badAlphaNumeric: string;
  badAlphaNumericExtra: string;
  wrongFileSize: string;
  wrongFileType: string;
  groupCheckedRangeStart: string;
  groupCheckedTooFewStart: string;
  groupCheckedTooManyStart: string;
  groupCheckedEnd: string;
  badCreditCard: string;
  badCVV: string;
  [key: string]: string;
}

/** ARIA bookkeeping, added in 3.0. */
interface JfvA11y {
  /** Give the input an id so an error summary can link to it. */
  ensureInputId($input: JQuery): string;
  /** Set aria-invalid. Applies in every error display mode. */
  markInvalid($input: JQuery): void;
  /** Set aria-invalid and point aria-describedby at the message element. */
  describeError($input: JQuery, $message: JQuery): void;
  /** Remove aria-invalid and detach only the token this plugin added. */
  clearError($input: JQuery): void;
  prefersReducedMotion(): boolean;
  /** Move focus, making a plain container focusable first. */
  focus($elem: JQuery): void;
}

interface JfvDialogs {
  resolveErrorMessage($elem: JQuery, validator: JfvValidator, validatorName: string, conf: JfvValidationConfig, language: JfvLanguageStrings): string;
  getParentContainer($elem: JQuery, conf?: JfvValidationConfig): JQuery;
  applyInputErrorStyling($input: JQuery, conf: JfvValidationConfig): void;
  applyInputSuccessStyling($input: JQuery, conf: JfvValidationConfig): void;
  removeInputStylingAndMessage($input: JQuery, conf: JfvValidationConfig): void;
  removeAllMessagesAndStyling($form: JQuery, conf: JfvValidationConfig): void;
  setInlineMessage($input: JQuery, errorMsg: string, conf: JfvValidationConfig): void;
  setMessageInTopOfForm(
    $form: JQuery,
    errorMessages: string[],
    conf: JfvValidationConfig,
    lang: JfvLanguageStrings,
    errorItems?: Array<{message: string; $input: JQuery}>
  ): void;
}

interface JfvFormUtils {
  validators: {[name: string]: JfvValidator};
  sanitizers: {[name: string]: JfvSanitizer};
  LANG: JfvLanguageStrings;
  a11y: JfvA11y;

  /** Bootstrap class-name presets, keyed by major version. */
  bootstrapPresets: {[majorVersion: string]: Partial<JfvValidationConfig>};
  /** Config overlay for a `bootstrap` option value. Unknown versions warn and return {}. */
  bootstrapPreset(version?: 3 | 4 | 5 | string | false): Partial<JfvValidationConfig>;
  /** True when the configured Bootstrap version validates via `is-invalid` + `.invalid-feedback` (4 and 5). */
  usesBootstrapValidationApi(conf?: JfvValidationConfig): boolean;
  dialogs: JfvDialogs;

  /** Setting this true during validation stops the form from being submitted. */
  haltValidation: boolean;
  isLoadingModules: boolean;
  loadedModules: {[name: string]: boolean};

  addValidator(validator: JfvValidator): void;
  addAsyncValidator(validator: JfvAsyncValidator): void;
  addSanitizer(sanitizer: JfvSanitizer): void;

  defaultConfig(): JfvValidationConfig;
  validateInput(
    $elem: JQuery,
    language: JfvLanguageStrings,
    conf: JfvValidationConfig,
    $form: JQuery,
    eventContext?: string
  ): JfvValidationResult;

  /**
   * Load modules by name. Modules already registered -- which is the case when
   * the page imported them directly -- resolve without a network request.
   */
  loadModules(modules: string, path?: string | null, callback?: () => void): void;
  registerLoadedModule(name: string): void;
  hasLoadedModule(name: string): boolean;
  /** Strips a trailing ".js" so "lang/sv.js" and "lang/sv" match. Added in 3.0. */
  normalizeModuleName(name: string): string;

  getValue(query: JQuery | string, $parent?: JQuery): string | false;
  parseDate(val: string, dateFormat: string, addMissingLeadingZeros?: boolean): number[] | false;
  numericRangeCheck(value: number, rangeAllowed: string): any[];
  suggest($elem: JQuery, suggestions: string[], settings?: object): JQuery;
  warn(msg: string, fallbackOnAlert?: boolean): void;

  /** Available once the html5 module is loaded. */
  setupValidationUsingHTML5Attr?($form: JQuery, conf?: JfvValidationConfig): void;

  [key: string]: any;
}

interface JQueryStatic {
  /** Set up validation on one or more forms. */
  validate(conf?: JfvValidationConfig): void;

  /** Configure validation in JavaScript. Requires the "jsconf" module. */
  setupValidation?(conf: JfvValidationConfig & {validation?: object; validate?: object}): void;

  formUtils: JfvFormUtils;

  split(
    val: string,
    callback?: ((str: string, i: number) => any) | string,
    allowSpaceAsDelimiter?: boolean
  ): string[] | void;
}

interface JQuery<TElement = HTMLElement> {
  /** Validate every field in the form. */
  isValid(language?: Partial<JfvLanguageStrings>, conf?: JfvValidationConfig, displayError?: boolean): boolean;

  /** Validate these elements, reporting the outcome to a callback. */
  validate(
    cb?: (isValid: boolean, el: Element, evt: JQuery.Event) => void,
    conf?: JfvValidationConfig,
    lang?: Partial<JfvLanguageStrings>
  ): void;

  validateOnBlur(language?: Partial<JfvLanguageStrings>, conf?: JfvValidationConfig): this;
  validateOnEvent(language?: Partial<JfvLanguageStrings>, conf?: JfvValidationConfig): this;
  validateInputOnBlur(
    language?: Partial<JfvLanguageStrings>,
    conf?: JfvValidationConfig,
    attachInputEvent?: boolean,
    eventContext?: string
  ): this;

  /** Re-validate as the value changes. Bound to "input" since 3.0. */
  validateOnInput(language?: Partial<JfvLanguageStrings>, conf?: JfvValidationConfig): this;
  removeInputValidation(): this;

  /** @deprecated since 3.0, use validateOnInput */
  validateOnKeyUp(language?: Partial<JfvLanguageStrings>, conf?: JfvValidationConfig): this;
  /** @deprecated since 3.0, use removeInputValidation */
  removeKeyUpValidation(): this;

  /** Read, set or remove a data-validation-* attribute. */
  valAttr(name: string, val?: string | boolean | null): any;
  willPostponeValidation(): boolean;
  showHelpOnFocus(attrName?: string | null, helpTextClass?: string): this;
  addSuggestions(settings?: object): this;
  restrictLength(maxLengthElement: JQuery): this;
}
