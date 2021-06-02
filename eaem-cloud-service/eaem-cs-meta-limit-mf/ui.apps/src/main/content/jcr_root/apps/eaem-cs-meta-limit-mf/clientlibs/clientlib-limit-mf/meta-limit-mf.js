(function($, $document){
    var DATA_MF_NAME = "data-granite-coral-multifield-name",
        MF_NAME = "./jcr:content/metadata/eaemKeywords",
        EAEM_VALIDATION_ERROR = "eaem-assets-validation-error",
        EAEM_MAX_ITEMS = 5,
        EAEM_MIN_ITEMS = 1, continueSave = true;

    $document.on("foundation-contentloaded", validateMF);

    function validateMF(){
        var $multifield = $("[" + DATA_MF_NAME + "='" + MF_NAME + "']");

        addValidator($multifield, EAEM_MAX_ITEMS, EAEM_MIN_ITEMS);

        var validation = $multifield.adaptTo("foundation-validation");

        validation.checkValidity();

        validation.updateUI();

        $("#shell-propertiespage-doneactivator").click(function(event){
            if(continueSave){
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            showAlert("error", "Error", "Validation failed");
        })
    }

    function addValidator($multifield, maxItems, minItems){
        if(maxItems){
            maxItems = parseInt(maxItems);
        }

        if(minItems){
            minItems = parseInt(minItems);
        }

        $multifield.attr("aria-required","true");

        var registry = $(window).adaptTo("foundation-registry");

        registry.register("foundation.validation.validator", {
            selector: "#" + $multifield.attr("id"),
            validate: validate
        });

        function validate(){
            var count = $multifield[0]._items.length;

            continueSave = true;

            if(maxItems && (count > maxItems) ){
                continueSave = false;
                return "Maximum allowed : " + maxItems + " items";
            }

            if(minItems && (count < minItems) ){
                continueSave = false;
                return "Minimum required : " + minItems + " items";
            }

            return false;
        }
    }

    function showAlert(variant, header, content) {
        var $dialog = $("#" + EAEM_VALIDATION_ERROR), dialog;

        if (!_.isEmpty($dialog)) {
            $dialog[0].show();
            return;
        }

        dialog = new Coral.Dialog().set({
            id: EAEM_VALIDATION_ERROR,
            variant: variant,
            closable: "on",
            header: {
                innerHTML: header
            },
            content: {
                innerHTML: content
            },
            footer: {
                innerHTML: '<button is="coral-button" variant="default" coral-close>OK</button>'
            }
        });

        document.body.appendChild(dialog);

        dialog.show();
    }
}(jQuery, jQuery(document)));