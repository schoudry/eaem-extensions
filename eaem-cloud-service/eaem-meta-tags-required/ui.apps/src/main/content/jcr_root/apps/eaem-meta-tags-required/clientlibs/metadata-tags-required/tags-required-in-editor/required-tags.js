(function($, $document) {
    $document.on("foundation-contentloaded", validateOnLoad);

    function validateOnLoad(){
        var $tagFields = $("foundation-autocomplete[required='true']");

        _.each($tagFields, function(tagField){
            var validation = $(tagField).adaptTo("foundation-validation");

            validation.checkValidity();

            validation.updateUI();
        })
    }
}(jQuery, jQuery(document)));