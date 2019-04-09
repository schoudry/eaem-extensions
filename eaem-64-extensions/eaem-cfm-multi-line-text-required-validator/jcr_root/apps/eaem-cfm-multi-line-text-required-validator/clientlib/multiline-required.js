(function ($, $document) {
    var CFM = window.Dam.CFM,
        EAEM_INVISIBLE_CLASS = "eaem-text-invisible",
        PLAIN_MARKDOWN_SELECTOR = "textarea.plaintext-editor, textarea.markdown-editor",
        registry = $(window).adaptTo("foundation-registry");

    //for plain text, markdown
    registry.register("foundation.validation.validator", {
        selector: PLAIN_MARKDOWN_SELECTOR,
        validate: validator
    });

    //for richtext
    registry.register("foundation.validation.validator", {
        selector:  "." + EAEM_INVISIBLE_CLASS,
        validate: validator,
        show: function (invisibleText, message) {
            $(invisibleText).prevAll("[data-cfm-richtext-editable]").css("border-color", "#e14132");
        },
        clear: function (invisibleText) {
            $(invisibleText).prevAll("[data-cfm-richtext-editable]").css("border-color", "#d0d0d0");
        }
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
            var $eaemCopyField = $("<input type=text style='display:none' class='" + EAEM_INVISIBLE_CLASS + "'/>")
                                        .insertAfter($rte);

            var $rteEditable = $rte.prev("[data-cfm-richtext-editable]");

            $eaemCopyField.val($rteEditable.text().trim());

            checkValidity.call($eaemCopyField[0]);

            $rte.prev("[data-cfm-richtext-editable]").on("input", function() {
                $eaemCopyField.val($(this).text().trim());
                checkValidity.call($eaemCopyField[0]);
            });
        }else{
            //$(PLAIN_MARKDOWN_SELECTOR).each(checkValidity);
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