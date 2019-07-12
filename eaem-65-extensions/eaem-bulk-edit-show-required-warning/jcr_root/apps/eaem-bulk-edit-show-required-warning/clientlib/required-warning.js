(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        META_EDITOR_FORM_SEL = "#aem-assets-metadataeditor-formid",
        SOFT_SUBMIT_SEL = "#soft-submit-popover",
        FOUNDATION_SELECTIONS_CHANGE = "foundation-selections-change",
        DAM_ADMIN_CHILD_PAGES_SEL = ".cq-damadmin-admin-childpages",
        INVALIDS_KEY = "foundationValidationBind.internal.invalids";

    $.fn.metadataUpdateErrorUI = $.fn.updateErrorUI;

    $.fn.updateErrorUI = function() {
        $.fn.superUpdateErrorUI.call(this);
        $.fn.metadataUpdateErrorUI.call(this);
    };

    function validateRequiredFields() {
        var $fields = $('.data-fields.active [aria-required="true"]'), $ele;

        $fields.each(function(index, field){
            Coral.commons.ready(field, function(elem) {
                $ele = $(elem);

                $ele.checkValidity();
                $ele.updateErrorUI();
            });
        });
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "error", options, callback);
    }

    $document.on(FOUNDATION_CONTENT_LOADED, function() {
        validateRequiredFields();
    });

    $document.on(FOUNDATION_SELECTIONS_CHANGE, DAM_ADMIN_CHILD_PAGES_SEL , function(e) {
        validateRequiredFields();
    });

    $document.on("coral-overlay:open", SOFT_SUBMIT_SEL , function() {
        var invalids = $(META_EDITOR_FORM_SEL).data(INVALIDS_KEY);

        if (!invalids || (invalids.length === 0)) {
            $(SOFT_SUBMIT_SEL).show();
        }else{
            $(SOFT_SUBMIT_SEL).hide();
            showAlert("One or more required field(s) is/are empty.", "Error");
        }
    });
})(jQuery, jQuery(document));