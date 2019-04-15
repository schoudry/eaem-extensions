(function ($, $document) {
    var CHECKBOX_SELECTOR = ".eaem-mf-dialog-select-one-checkbox";

    $document.on("dialog-ready", addSelectSingleCheckboxListener);

    function addSelectSingleCheckboxListener(){
        $document.on('change',  CHECKBOX_SELECTOR, function(e) {
            $(CHECKBOX_SELECTOR).not(this).prop('checked', false);
        });
    }
}(jQuery, jQuery(document), Granite.author));