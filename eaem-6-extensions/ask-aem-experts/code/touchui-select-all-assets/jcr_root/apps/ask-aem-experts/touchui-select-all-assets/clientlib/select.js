(function ($, $document) {

    //selects all assets
    //http://docs.adobe.com/docs/en/aem/6-0/develop/ref/granite-ui/api/jcr_root/libs/granite/ui/components/foundation/clientlibs/foundation/vocabulary/selections.html
    $document.on("foundation-contentloaded", ".foundation-collection", function () {
        var $collection = $(".foundation-collection"),
            $$selection = $collection.adaptTo("foundation-selections"),
            items = $(this).find(".foundation-collection-item");

        $.each(items, function (i, item) {
            //$$selection.select(item);
        });
    });
})($, $(document));