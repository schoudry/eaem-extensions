(function($, $document) {
    var extended = false, LETTER_COUNT = 22, INCREASE_BY = 1.5,
        CV_ITEM_HEIGHT = 3, CV_LABEL_HEIGHT = 2;

    $document.on("foundation-contentloaded", handlePathBrowser);

    function handlePathBrowser(){
        if(extended){
            return;
        }

        extended = true;

        var cuiPathBrowser = $(".coral-PathBrowser").data("pathBrowser");

        if(!cuiPathBrowser){
            return;
        }

        //handle picker columns
        extendPicker(cuiPathBrowser);
    }

    function extendPicker(cuiPathBrowser){
        var cuiPicker = cuiPathBrowser.$picker.data("picker");

        cuiPathBrowser.$button.on("click", function() {
            setTimeout(function(){
                if(!cuiPicker.columnView){
                    console.log("EAEM - could not initialize column view");
                    return;
                }

                extendColumnView(cuiPicker.columnView);
            }, 200);
        });
    }

    function extendColumnView(columnView){
        function handler(event, href, data){
            var $html = $(columnView._data[href]), height, increase,
                $labels = $html.find(".coral-ColumnView-label"),
                $label, $cvItem;

            $labels.each(function(index, label){
                $label = $(label);

                $cvItem = $label.closest(".coral-ColumnView-item");

                increase = (INCREASE_BY * Math.floor($label.html().length / LETTER_COUNT));

                $cvItem.css("height", (CV_ITEM_HEIGHT + increase) + "rem");

                $label.css("height",(CV_LABEL_HEIGHT + increase) + "rem").css("white-space", "normal");
            });

            columnView._data[href] = $html[0].outerHTML;
        }

        columnView.$element.on('coral-columnview-load', handler);
    }
})(jQuery, jQuery(document));