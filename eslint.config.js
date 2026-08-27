/**
 * ESLint flat config, replacing the .jshintrc this project used through 2.x.
 *
 * The library source is ES5 on purpose: it ships as a UMD bundle that still
 * supports jQuery 1.8, so it is linted as ES5 and against browser globals.
 * The build tooling is a separate, modern, Node-flavoured world.
 */

const BROWSER_GLOBALS = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  console: 'readonly',
  alert: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  performance: 'readonly',
  Promise: 'readonly',
  // Used by the breach screening validator, all feature detected before use.
  fetch: 'readonly',
  crypto: 'readonly',
  TextEncoder: 'readonly',
  Uint8Array: 'readonly',
  MutationObserver: 'readonly',
  FileReader: 'readonly',
  Image: 'readonly',
  // Third party globals the plugin integrates with.
  jQuery: 'readonly',
  define: 'readonly',
  require: 'readonly',
  grecaptcha: 'readonly',
  numeral: 'readonly'
};

const NODE_GLOBALS = {
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  process: 'readonly',
  console: 'readonly',
  __dirname: 'readonly',
  Promise: 'readonly'
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      // Build output, including the UMD wrappers grunt-umd generates.
      'dist/**',
      'form-validator/**',
      'test/**',
      'types/**'
    ]
  },

  {
    // Library source.
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',
      globals: BROWSER_GLOBALS
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      // Carried over from .jshintrc.
      curly: 'error',
      eqeqeq: 'error',
      'no-eq-null': 'off',
      'no-caller': 'error',
      quotes: ['error', 'single', {avoidEscape: true}],
      // ES5 has no optional catch binding, so an unused one is unavoidable.
      'no-unused-vars': ['error', {args: 'none', caughtErrors: 'none'}],
      'no-redeclare': 'error',
      'no-undef': 'error',

      // Dropped from the old config: "onevar", which forced a single var
      // statement per function and is not how any of this code is written.

      // Cheap correctness rules the old config did not have.
      'no-implicit-globals': 'error',
      // Off because (function ($, undefined) {...}) is used deliberately
      // throughout this codebase: an ES3 era idiom guaranteeing 'undefined'
      // really is undefined inside the closure. Obsolete since ES5 made it
      // non-writable, but harmless, and not worth touching four files for.
      'no-shadow-restricted-names': 'off',
      'no-unsafe-negation': 'error',
      'no-cond-assign': ['error', 'except-parens'],
      'no-constant-condition': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-fallthrough': 'error',
      'no-irregular-whitespace': 'error',
      'no-sparse-arrays': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error'
    }
  },

  {
    // Build tooling: modern Node, not shipped to a browser.
    files: ['Gruntfile.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: NODE_GLOBALS
    },
    rules: {
      curly: 'error',
      eqeqeq: 'error',
      'no-unused-vars': ['error', {args: 'none'}],
      'no-undef': 'error'
    }
  }
];
