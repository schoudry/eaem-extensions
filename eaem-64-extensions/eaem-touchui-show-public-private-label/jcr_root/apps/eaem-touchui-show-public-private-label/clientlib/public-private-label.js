(function ($, $document) {
    "use strict";

    var PUBLIC_COLLECTION_ROOT = "/content/dam/collections/public",
        PRIVATE_COLLECITON = "Private Collection",
        PUBLIC_COLLECITON = "Public Collection";

	$document.on("foundation-contentloaded", function(event){
        _.defer(function(){
            showLabel();
        });
    });

    function showLabel(){
        var $items = $("coral-masonry-item"), $item, itemId, text;

        $items.each(function(){
            $item = $(this);

            itemId = $item.data("graniteCollectionItemId");

            if(itemId.indexOf(PUBLIC_COLLECTION_ROOT) == 0){
                text = PUBLIC_COLLECITON;
            }else{
                text = PRIVATE_COLLECITON;
            }

            $item.find("coral-card-context").html(text);
        });
    }
})(jQuery, jQuery(document));
