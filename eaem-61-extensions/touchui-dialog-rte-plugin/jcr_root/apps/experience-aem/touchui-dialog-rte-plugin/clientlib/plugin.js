(function ($, $document) {
    var CORAL_RTE = ".coral-RichText";

    $document.on("dialog-ready", function() {
        var $editable = $(CORAL_RTE);

        $editable.data("config-path", '/apps/experience-aem/touchui-dialog-rte-plugin/sample-component/cq:dialog/content/items/column/items/fieldset/items/column/items/text.infinity.json');
    });
})(jQuery, jQuery(document));