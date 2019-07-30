(function($, $document) {
    var EAEM_METADATA_EXISTS_PREDICATE = ".eaem-metadata-exists-predicate";

    $document.on("change", EAEM_METADATA_EXISTS_PREDICATE, function(event) {
        $(EAEM_METADATA_EXISTS_PREDICATE).removeAttr("checked");
        event.currentTarget.checked = true;

        var $form = $(this).closest(".granite-omnisearch-form");
        $form.submit();
    })

})(jQuery, jQuery(document));