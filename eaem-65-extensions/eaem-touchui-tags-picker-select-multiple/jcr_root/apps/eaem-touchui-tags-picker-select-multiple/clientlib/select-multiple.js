(function($, $document) {
    var TAGS_FIELD = "./jcr:content/metadata/cq:tags",
        LETTER_COUNT = 22, INCREASE_BY = 1.5, CV_ITEM_HEIGHT = 3, CV_LABEL_HEIGHT = 2,
        extended = false;

    $document.on("foundation-contentloaded", handleTagsPicker);

    function handleTagsPicker(){
        if(extended){
            return;
        }

        var $tagsField = $("foundation-autocomplete[name='" + TAGS_FIELD + "']");

        if(_.isEmpty($tagsField)){
            return;
        }

        var pathField = $tagsField[0];

        extended = true;

        extendPicker(pathField);
    }

    function extendPicker(pathField){
        var origShowPicker = pathField._showPicker;

        pathField._showPicker = function(){
            origShowPicker.call(this);

            var columnView = $(this._picker.el).find("coral-columnview")[0];

            columnView.on("coral-columnview:navigate", showFullTitle);
        }
    }

    function showFullTitle(event){
        var $item, $content, increase, $cvItem;

        $(event.detail.column).find("coral-columnview-item").each(function(index, item){
            $item = $(item);

            $content = $item.find("coral-columnview-item-content");

            increase = (INCREASE_BY * Math.floor($content.html().length / LETTER_COUNT));

            if($item.prop("variant") == "drilldown"){
                increase++;
            }

            $item.css("height", (CV_ITEM_HEIGHT + increase) + "rem");

            $content.css("height",(CV_LABEL_HEIGHT + increase) + "rem").css("white-space", "normal");
        });
    }
})(jQuery, jQuery(document));