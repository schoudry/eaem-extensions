(function ($, $document) {
    var LETTER_COUNT = 22, INCREASE_BY = 1.5, CV_ITEM_HEIGHT = 3, CV_LABEL_HEIGHT = 2,
        extended = false;

    $document.on("foundation-contentloaded", handleAssetPicker);

    function handleAssetPicker(){
        var $autoCompletes = $("foundation-autocomplete");

        if(_.isEmpty($autoCompletes)){
            return;
        }

        extended = true;

        _.each($autoCompletes, function(autoComplete){
            if(autoComplete.eaemExtended){
                return;
            }

            extendPicker(autoComplete);

            autoComplete.eaemExtended = true;
        });
    }

    function extendPicker(pathField){
        var origShowPicker = pathField._showPicker;

        pathField._showPicker = function(){
            origShowPicker.call(this);

            var columnView = $(this._picker.el).find("coral-columnview")[0];

            columnView.on("coral-columnview:navigate", showFullName);

            var dummyEvent = { detail : { column: $(columnView).find("coral-columnview-column")[0] } };

            showFullName(dummyEvent);
        }
    }

    function showFullName(event){
        var $item, $content, increase, $title, $thumbnail;

        $(event.detail.column).find("coral-columnview-item").each(function(index, item){
            $item = $(item);

            $content = $item.find("coral-columnview-item-content");

            $title = $content.find(".foundation-collection-item-title");

            if(!isEllipsisActive($title[0])){
                return;
            }

            $item.css("height", "auto");

            $content.css("height", "auto");

            $title.css("height","auto").css("white-space", "normal");

            $thumbnail = $item.find("coral-columnview-item-thumbnail");

            $thumbnail.css("display", "flex")
                .css("align-items", "center").css("height", $item.css("height"));
        });
    }

    function isEllipsisActive(e) {
        return (e.offsetWidth < e.scrollWidth);
    }
}(jQuery, jQuery(document)));