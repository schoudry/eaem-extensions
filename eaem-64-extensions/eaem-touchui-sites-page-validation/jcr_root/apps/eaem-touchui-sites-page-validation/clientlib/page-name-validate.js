(function ($, $window) {
    "use strict";

    var PATTERN = /^[a-z0-9_]+$/,
        ERROR_MSG = "Acceptable characters in page name are lowercase alphabets, numbers, underscore <b>" + PATTERN + "</b>";

    $window.adaptTo("foundation-registry").register("foundation.validation.validator", {
        selector: '[data-foundation-validation~="admin.pagename"]',
        validate: function(el) {
            if (!PATTERN.test(el.value)) {
                return ERROR_MSG;
            }
        }
    });
}(jQuery, jQuery(window)));
