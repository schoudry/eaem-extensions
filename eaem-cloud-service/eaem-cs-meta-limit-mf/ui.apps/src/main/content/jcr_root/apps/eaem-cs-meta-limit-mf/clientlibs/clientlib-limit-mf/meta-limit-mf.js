(function($, $document){
    var DATA_MF_NAME = "data-granite-coral-multifield-name",
        MF_NAME = "./jcr:content/metadata/eaemKeywords",
        EAEM_MAX_ITEMS = 5,
        EAEM_MIN_ITEMS = 1;

    $document.on("foundation-contentloaded", validateMF);

    function validateMF(){
        addValidator($("[" + DATA_MF_NAME + "='" + MF_NAME + "']"), EAEM_MAX_ITEMS, EAEM_MIN_ITEMS);
    }

    function addValidator($multifield, maxItems, minItems){
        if(maxItems){
            maxItems = parseInt(maxItems);
        }

        if(minItems){
            minItems = parseInt(minItems);
        }

        $.validator.register({
            selector: "#" + $multifield.attr("id"),
            validate: validate
        });

        function validate(){
            var count = $multifield[0]._items.length;

            if(maxItems && (count > maxItems) ){
                return "Maximum allowed : " + maxItems + " items";
            }

            if(minItems && (count < minItems) ){
                return "Minimum required : " + minItems + " items";
            }

            return null;
        }
    }
}(jQuery, jQuery(document)));