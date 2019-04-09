(function ($, $document) {
    var CFM = window.Dam.CFM,
        EAEM_INVISIBLE_CLASS = "eaem-text-invisible",
        SELECTOR = "textarea.plaintext-editor, textarea.markdown-editor, ." + EAEM_INVISIBLE_CLASS,
        registry = $(window).adaptTo("foundation-registry");

    registry.register("foundation.validation.validator", {
        selector: SELECTOR,
        validate: validator
    });

    CFM.Core.registerReadyHandler(registerRTEValidator);

    function registerRTEValidator(){
        var $cfmMultiEditor = $(".cfm-multieditor");

        if ($cfmMultiEditor.find(".coral-Form-field").attr("aria-required") !== "true") {
            return;
        }

        var $multiLineLabel = $cfmMultiEditor.find(".cfm-multieditor-embedded-label");

        $multiLineLabel.html($multiLineLabel.html() + " *");

        var $rte = $("textarea.rte-sourceEditor");

        if(!_.isEmpty($rte)){
            //coral validation framework ignores hidden and contenteditable fields, so add an invisible text field
            //the text field is just for registering a validator
            var $eaemCopyField = $("<input type=text style='display:inline' class='" + EAEM_INVISIBLE_CLASS + "'/>")
                .insertAfter($rte);

            $rte.prev("[data-cfm-richtext-editable]").on("input", function() {
                $eaemCopyField.val($(this).text().trim());
                checkValidity.call($eaemCopyField[0]);
            });

            checkValidity.call($eaemCopyField[0]);
        }
    }

    function checkValidity() {
        var foundationValidation = $(this).adaptTo("foundation-validation");
        foundationValidation.checkValidity();
        foundationValidation.updateUI();
    }

    function validator(element){
        var $element = $(element),
            $cfmMultiLineField = $element.closest(".cfm-multieditor").find(".coral-Form-field");

        if ($cfmMultiLineField.attr("aria-required") !== "true") {
            return;
        }

        if (!_.isEmpty($element.val())) {
            return;
        }

        return Granite.I18n.get("Please fill out this field.");
    }
}(jQuery, jQuery(document)));