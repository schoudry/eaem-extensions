(function ($, $document) {
    var CORAL_RTE = ".coral-RichText",
        //copied from /etc/clientlibs/granite/coralui2/js/validations.js
        fieldErrorEl = $("<span class='coral-Form-fielderror coral-Icon coral-Icon--alert coral-Icon--sizeS' " +
                         "data-init='quicktip' data-quicktip-type='error' />");

    $document.on("dialog-ready", function() {
        //coral validation framework ignores hidden and contenteditable fields, so add an invisible text field
        //the text field is just for registering a validator
        $(CORAL_RTE).after("<input type=text style='display:none'/>");

        $(CORAL_RTE).on("input", function() {
            var $invisibleText = $(this).nextAll("input:text").val($(this).text().trim());

            $invisibleText.checkValidity();
            $invisibleText.updateErrorUI();
        })
    });

    //register the validator on richtext invisible text field
    $.validator.register({
        selector: ".richtext-container > input:text",

        validate: function ($invisibleText) {
            var $hidden = $invisibleText.prevAll("[type=hidden]"),
                isRequired = $hidden.attr("required") === true
                                    || $hidden.attr("aria-required") === "true";

            if (isRequired && $invisibleText.val().length === 0) {
                return $invisibleText.message("validation.required") || "required";
            }

            return null;
        },

        show: function ($invisibleText, message) {
            this.clear($invisibleText);

            var field = $invisibleText.prevAll(CORAL_RTE),
                arrow = field.closest("form").hasClass("coral-Form--vertical") ? "right" : "top";

            fieldErrorEl.clone()
                .attr("data-quicktip-arrow", arrow)
                .attr("data-quicktip-content", message)
                .insertAfter(field);

            field.attr("aria-invalid", "true").toggleClass("is-invalid", true);
        },

        clear: function ($invisibleText) {
            var field = $invisibleText.prevAll(CORAL_RTE);

            field.removeAttr("aria-invalid").removeClass("is-invalid")
                    .nextAll(".coral-Form-fielderror").tooltip("hide").remove();
        }
    });
})(jQuery, jQuery(document));