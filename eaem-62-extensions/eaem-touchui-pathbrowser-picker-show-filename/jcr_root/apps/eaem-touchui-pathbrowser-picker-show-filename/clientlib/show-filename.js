(function ($, $document, gAuthor) {
    var LINK_URL = "./linkURL",
        COMPONENT = "foundation/components/image";

    if(!gAuthor){
        return;
    }

    $document.on('dialog-ready', handlePathBrowser);

    function handlePathBrowser(){
        var $linkUrl = $("[name='" + LINK_URL + "']"),
            editable = gAuthor.DialogFrame.currentDialog.editable;

        //if not an image component dialog, return
        if((editable.type !== COMPONENT) || _.isEmpty($linkUrl)){
            return;
        }

        var cuiPathBrowser = $linkUrl.closest(".coral-PathBrowser").data("pathBrowser");

        if(!cuiPathBrowser){
            return;
        }

        //handle picker columns
        extendPicker(cuiPathBrowser);
    }

    //extend picker to disable columns
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
        function handler(event){
            var $element = event && event.currentTarget ? $(event.currentTarget) : columnView.$element,
                $items = $element.find(".coral-ColumnView-item"),
                $item, dataValue;

            $items.each(function(index, item){
                $item = $(item);

                dataValue = $item.data("value");

                if(_.isEmpty(dataValue)){
                    return;
                }

                $item.find(".coral-ColumnView-label").html(getStringAfterLastSlash(dataValue));
            });
        }

        handler();

        columnView.$element.on('coral-columnview-load', handler);

        columnView.$element.on('coral-columnview-item-select', function(){
            // event coral-columnview-item-select is triggered before selected column load
            // hope the data gets loaded in 1000 msecs
            setTimeout(handler, 1000);
        });
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }
}(jQuery, jQuery(document), Granite.author));