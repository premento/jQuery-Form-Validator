/**
 * Utility methods used for handling loading of modules (attached to $.formUtils)
 */
(function($) {

  'use strict';

  $.formUtils = $.extend($.formUtils || {}, {

    /**
     * @var {Boolean}
     */
    isLoadingModules: false,

    /**
     * @var {Object}
     */
    loadedModules: {},

    /**
     * Module names reach us in several shapes -- "security", "security.js",
     * "lang/sv.js" -- so normalise before comparing. The ".dev" suffix is
     * deliberately left intact: it exists to bypass the cache, and collapsing
     * it onto the plain name would defeat that.
     *
     * @param {String} name
     * @return {String}
     */
    normalizeModuleName: function (name) {
      return (name || '').trim().toLowerCase().replace(/\.js$/, '');
    },

    /**
     * @param {String} name
     */
    registerLoadedModule: function (name) {
      this.loadedModules[this.normalizeModuleName(name)] = true;
    },

    /**
     * @param {String} name
     * @return {Boolean}
     */
    hasLoadedModule: function (name) {
      return this.normalizeModuleName(name) in this.loadedModules;
    },

    /**
     * @example
     *  $.formUtils.loadModules('date, security.dev');
     *
     * Will load the scripts date.js and security.dev.js from the
     * directory where this script resides. If you want to load
     * the modules from another directory you can use the
     * path argument.
     *
     * The script will be cached by the browser unless the module
     * name ends with .dev
     *
     * @param {String} modules - Comma separated string with module file names (no directory nor file extension)
     * @param {String} [path] - Path where the module files are located if their not in the same directory as the core modules
     * @param {function} [callback] - Callback invoked when all modules are loaded
     */
    loadModules: function (modules, path, callback) {

      if ($.formUtils.isLoadingModules) {
        setTimeout(function () {
          $.formUtils.loadModules(modules, path, callback);
        }, 100);
        return;
      }

      // Everything already registered -- which is the normal case when the page
      // imports the modules directly rather than naming them in the modules
      // option. There is nothing to fetch, and no reason to go hunting for a
      // script path that an ES module page does not have. Without this the
      // callback is deferred to document ready, which delays validatorsLoaded
      // and with it anything that listens for it, such as the language files.
      var everythingLoaded = true;
      $.each($.split(modules), function (i, modName) {
        if (modName.length && !$.formUtils.hasLoadedModule(modName)) {
          everythingLoaded = false;
          return false;
        }
      });

      if (everythingLoaded) {
        if (typeof callback === 'function') {
          callback();
        }
        return;
      }

      var loadModuleScripts = function (modules, path) {

          var moduleList = $.split(modules),
            numModules = moduleList.length,
            moduleLoadedCallback = function () {
              numModules--;
              if (numModules === 0) {
                $.formUtils.isLoadingModules = false;
                if (typeof callback === 'function') {
                    callback();
                }
              }
            };

          if (numModules > 0) {
            $.formUtils.isLoadingModules = true;
          }

          var cacheSuffix = '?_=' + ( new Date().getTime() ),
            appendToElement = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0];

          $.each(moduleList, function (i, modName) {
            modName = (modName || '').trim();
            if (modName.length === 0 || $.formUtils.hasLoadedModule(modName)) {
              moduleLoadedCallback();
            } else {
              var scriptUrl = path + modName + (modName.slice(-3) === '.js' ? '' : '.js'),
                script = document.createElement('SCRIPT');

              if (typeof define === 'function' && define.amd) {
                require([scriptUrl + ( scriptUrl.slice(-7) === '.dev.js' ? cacheSuffix : '' )], moduleLoadedCallback);
              } else {
                // Load the script
                script.type = 'text/javascript';
                script.onload = moduleLoadedCallback;
                script.src = scriptUrl + ( scriptUrl.slice(-7) === '.dev.js' ? cacheSuffix : '' );
                script.onerror = function() {
                  $.formUtils.warn(
                    'Unable to load form validation module ' + scriptUrl + '. ' +
                    'If this page is built with a bundler or served under a strict ' +
                    'Content-Security-Policy, import the module instead of naming it ' +
                    'in the modules option: import \'jquery-form-validator/modules/' +
                    modName + '\';',
                    true
                  );
                  moduleLoadedCallback();
                };
                appendToElement.appendChild(script);
              }
            }
          });
        };

      if (path) {
        loadModuleScripts(modules, path);
      } else {
        var findScriptPathAndLoadModules = function () {
          var foundPath = false;
          $('script[src*="form-validator"]').each(function () {
            var isScriptFromPluginNodeModulesDirectory = this.src.split('form-validator')[1].split('node_modules').length > 1;
            if (!isScriptFromPluginNodeModulesDirectory) {
              foundPath = this.src.substr(0, this.src.lastIndexOf('/')) + '/';
              if (foundPath === '/') {
                foundPath = '';
              }
              return false;
            }
          });

          if (foundPath !== false) {
            loadModuleScripts(modules, foundPath);
            return true;
          }
          return false;
        };

        if (!findScriptPathAndLoadModules()) {
          $(function () {
            var hasLoadedModuleScripts = findScriptPathAndLoadModules();
            if (!hasLoadedModuleScripts) {
              // The modules may have been inserted via a minified script
              if (typeof callback === 'function') {
                callback();
              }
            }
          });
        }
      }
    }

  });

})(jQuery);
