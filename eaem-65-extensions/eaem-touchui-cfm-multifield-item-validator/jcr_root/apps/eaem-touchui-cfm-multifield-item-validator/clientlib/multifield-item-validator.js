(function ($, $document) {
    var CORAL_MULTI_FIELD = "coral-multifield",
        CORAL_MULTIFIELD_ITEM = "CORAL-MULTIFIELD-ITEM",
        REQ_MF_SEL = "coral-multifield[aria-required='true']",
        mfValidator;

    $(REQ_MF_SEL).on("coral-collection:add", function(event){
        Coral.commons.ready(event.detail.item, handleRequiredOnAdd);
    });

    $(REQ_MF_SEL).on("coral-collection:remove", function(){
        handleRequired(this);
    });

    $document.on("change", REQ_MF_SEL, function() {
        handleRequired(this);
    });

    function handleRequiredOnAdd(mfItem){
        if(mfItem.tagName != CORAL_MULTIFIELD_ITEM){
            return;
        }

        handleRequired($(mfItem).closest(CORAL_MULTI_FIELD)[0]);
    }

    function handleRequired(mField){
        var $fields = $(mField).find(".coral-Form-field");

        if(_.isEmpty($fields)){
            return;
        }

        var valid = true;

        $fields.each(function(i, field){
            var $field = $(field),
                val = $field.val().trim();

            if(!val){
                valid = false;
            }
        });

        if(!mfValidator){
            mfValidator = getMultifieldValidator();
        }

        if(valid){
            $(mField).trigger("foundation-validation-valid");
            mfValidator.clear(mField);
        }else{
            $(mField).trigger("foundation-validation-invalid");
            mfValidator.show(mField, "Please fill the individual items");
        }
    }

    function getMultifieldValidator(){
        var registry = $(window).adaptTo("foundation-registry");

        return _.reject(registry.get("foundation.validation.validator"), function(obj){
            return (obj.selector.indexOf(".coral-Form-fieldwrapper .coral-Form-field") < 0);
        })[0];
    }
}(jQuery, jQuery(document)));

