/**
 * jQuery Form Validator
 * ------------------------------------------
 *
 * Czech language package
 *
 * @website http://formvalidator.net/
 * @license MIT
 */
(function($, window) {

  'use strict';

  $.formUtils.registerLoadedModule('lang/cs');

  $(window).bind('validatorsLoaded', function() {

    $.formUtils.LANG = {
      errorTitle: 'Podání formuláře selhalo!',
      requiredField: 'Toto pole je povinné',
      requiredfields: 'Nebyly vyplněny všechny požadované pole',
      badTime: 'Neplatný čas',
      badEmail: 'Neplatná e-mailová adresa',
      badTelephone: 'Neplatné telefonní číslo',
      badSecurityAnswer: 'Chybná odpověď na bezpečnostní otázku',
      badDate: 'Nesprávné datum',
      lengthBadStart: 'Zadaná hodnota musí být v rozmezí ',
      lengthBadEnd: ' znaků',

      // 3.0 templates, composed from the fragments above so the rendered
      // sentence is unchanged. Reorder freely -- {0} is the number. Plural
      // forms may be added as {one: ..., other: ...} where this language
      // needs them.
      lengthBadRange: 'Zadaná hodnota musí být v rozmezí {0} znaků',
      lengthTooShort: 'Zadaná hodnota je menší než {0} znaků',
      lengthTooLong: 'Zadaná hodnota je větší než {0} znaků',
      groupCheckedRange: 'Prosím, vyberte {0} složka(y)',
      groupCheckedTooFew: 'Vyberte prosím nejméně {0} složka(y)',
      groupCheckedTooMany: 'Vyberte prosím maximálně {0} složka(y)',
      badNumberOfSelectedOptions: 'Musíte vybrat nejméně {0} odpověď',
      lengthTooLongStart: 'Zadaná hodnota je větší než ',
      lengthTooShortStart: 'Zadaná hodnota je menší než ',
      notConfirmed: 'Zadané hodnoty nebyly potvrzené',
      badDomain: 'Neplatná doména',
      badUrl: 'Neplatný URL',
      badCustomVal: 'Zadaná hodnota je chybná',
      andSpaces: ' a mezery',
      badInt: 'Neplatné číslo',
      badSecurityNumber: 'Neplatné číslo zabezpečení',
      badUKVatAnswer: 'Neplatné číslo DIČ ',
      badStrength: 'Vaše heslo není dostatečně silné',
      badNumberOfSelectedOptionsStart: 'Musíte vybrat nejméně ',
      badNumberOfSelectedOptionsEnd: ' odpověď',
      badAlphaNumeric: 'Zadaná hodnota může obsahovat pouze alfanumerické znaky ',
      badAlphaNumericExtra: ' a ',
      wrongFileSize: 'Soubor je příliš velký (max %s)',
      wrongFileType: 'Pouze soubory typu %s',
      groupCheckedRangeStart: 'Prosím, vyberte ',
      groupCheckedTooFewStart: 'Vyberte prosím nejméně ',
      groupCheckedTooManyStart: 'Vyberte prosím maximálně ',
      groupCheckedEnd: ' složka(y)',
      badCreditCard: 'Číslo kreditní karty je neplatné',
      badCVV: 'Číslo CVV je neplatné',
      wrongFileDim: 'Nesprávné rozměry obrázku,',
      imageTooTall: 'obraz nemůže být vyšší než',
      imageTooWide: 'obraz nemůže být širší než',
      imageTooSmall: 'obraz je příliš malý',
      min: 'min',
      max: 'max',
      imageRatioNotAccepted: 'Poměr obrázku je nesprávný',
      badBrazilTelephoneAnswer: 'Neplatné telefonní číslo',
      badBrazilCEPAnswer: 'Neplatné CEP',
      badBrazilCPFAnswer: 'Neplatné CPF'
    };

  });

})(jQuery, window);
