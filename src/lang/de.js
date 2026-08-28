/**
 * jQuery Form Validator
 * ------------------------------------------
 *
 * German language package
 *
 * @website https://github.com/premento/jQuery-Form-Validator
 * @license MIT
 */
(function($, window) {

  'use strict';

  $.formUtils.registerLoadedModule('lang/de');

  $(window).bind('validatorsLoaded', function() {

    $.formUtils.LANG = {
      errorTitle: 'Ihre Anfrage konnte nicht gesendet werden!',
      requiredField: 'Dies ist ein Pflichtfeld',
      requiredFields: 'Sie haben nicht alle Fragen beantwortet',
      badTime: 'Sie haben nicht die korrekte Zeit eingegeben',
      badEmail: 'Sie haben keine gültige E-Mail-Adresse eingegeben',
      badTelephone: 'Sie haben keine richtige Telefonnummer eingetragen',
      badSecurityAnswer: 'Sie haben die falsche Antwort auf die Sicherheitsfrage eingegeben',
      badDate: 'Eingabe eines falschen Datums',
      lengthBadStart: 'Der eingegebene Wert muss dazwischen sein ',
      lengthBadEnd: '  Zeichen',

      // 3.0 templates, composed from the fragments above so the rendered
      // sentence is unchanged. Reorder freely -- {0} is the number. Plural
      // forms may be added as {one: ..., other: ...} where this language
      // needs them.
      lengthBadRange: 'Der eingegebene Wert muss dazwischen sein {0}  Zeichen',
      lengthTooShort: 'Der eingegebene Wert ist kleiner als {0}  Zeichen',
      lengthTooLong: 'Der eingegebene Wert ist größer als {0}  Zeichen',
      groupCheckedRange: 'Wählen Sie zwischen{0} Auswahl',
      groupCheckedTooFew: 'Dann müssen Sie zumindest sicher,{0} Auswahl',
      groupCheckedTooMany: 'Sie können nicht mehr als zu machen{0} Auswahl',
      badNumberOfSelectedOptions: 'Wählen Sie zu mindestens {0} Antwort',
      lengthTooLongStart: 'Der eingegebene Wert ist größer als ',
      lengthTooShortStart: 'Der eingegebene Wert ist kleiner als ',
      notConfirmed: 'Die Eingaben sind unterschiedlich',
      badDomain: 'Sie haben die falsche Domäne eingetragen',
      badUrl: 'Sie haben nicht die richtige URL eingegeben',
      badCustomVal: 'Eingabe einer falschen Antwort',
      andSpaces: ' und Leerzeichen',
      badInt: 'Sie haben keine Nummer eingegeben',
      badSecurityNumber: 'Sie haben eine falsche Sozialversicherungsnummer eingegeben',
      badUKVatAnswer: 'Sie haben keine UK-Umsatzsteuer-Identifikationsnummer eingegeben',
      badStrength: 'Sie haben ein Kennwort, das nicht sicher genug ist eingegeben',
      badNumberOfSelectedOptionsStart: 'Wählen Sie zu mindestens ',
      badNumberOfSelectedOptionsEnd: ' Antwort',
      badAlphaNumeric: 'Sie können nur alphanumerische Zeichen (Buchstaben und Zahlen) eingeben',
      badAlphaNumericExtra: ' und',
      wrongFileSize: 'Die Datei, die Sie hochzuladen versuchen, ist zu groß (max %s)',
      wrongFileType: 'Nur Dateien vom Typ %s sind zulässig',
      groupCheckedRangeStart: 'Wählen Sie zwischen',
      groupCheckedTooFewStart: 'Dann müssen Sie zumindest sicher,',
      groupCheckedTooManyStart: 'Sie können nicht mehr als zu machen',
      groupCheckedEnd: ' Auswahl',
      badCreditCard: 'Sie haben eine ungültige Kreditkartennummer eingegeben',
      badCVV: 'Sie haben eine falsche CVV eingegeben',
      wrongFileDim: 'Illegale Bildgröße,',
      imageTooTall: 'Bild kann nicht größer sein als',
      imageTooWide: 'Bild kann nicht breiter sein als',
      imageTooSmall: 'Bild ist zu klein',
      min: 'min',
      max: 'max',
      imageRatioNotAccepted : 'Bildverhältnis wird nicht akzeptiert',
      badBrazilTelephoneAnswer: 'Die eingegebene Telefonnummer ist nicht korrekt',
      badBrazilCEPAnswer: 'Der CEP ist ungültig',
      badBrazilCPFAnswer: 'Der CEP ist ungültig'
    };

  });

})(jQuery, window);
