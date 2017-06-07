(function ($, $document) {
    "use strict";

    var LANGUAGE = "./language", COUNTRY = "./country";

    $document.on("dialog-ready", function() {
        var langCountries = {},
            $language = $("[name='" + LANGUAGE + "']"),
            $countryDelete = $("[name='" + COUNTRY + "@Delete']"),
            cuiLanguage = $language.closest(".coral-Select").data("select"),
            cuiCountry = $countryDelete.closest(".coral-Multifield").data("multifield"),
            $countryAdd = cuiCountry.$element.find(".js-coral-Multifield-add");

        cuiLanguage.on('selected.select', function(event){
            var $country;

            cuiCountry.$element.find(".js-coral-Multifield-remove").click();

            _.each(langCountries[event.selected], function(country){
                $countryAdd.click();
                $country = cuiCountry.$element.find("[name='" + COUNTRY + "']:last");
                $country.val(country);
            });
        });

        function fillCountries(data){
            var countries;

            _.each(data, function(country, code){
                if(!_.isObject(country) || (country.country === "*") ){
                    return;
                }

                code = getLangCode(code);

                countries = langCountries[code] || [];

                countries.push(country.country);

                langCountries[code] = countries;
            });
        }

        $.getJSON("/libs/wcm/core/resources/languages.2.json").done(fillCountries);
    });

    function getLangCode(code){
        if(code.indexOf("_") != -1){
            code = code.substring(0, code.indexOf("_"));
        }

        return code;
    }
})(jQuery, jQuery(document));