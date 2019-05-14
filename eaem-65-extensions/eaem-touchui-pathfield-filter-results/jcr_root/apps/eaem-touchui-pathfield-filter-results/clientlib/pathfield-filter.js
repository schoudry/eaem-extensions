(function ($, $document) {
    var LINK_URL = "./linkURL",
        COMPONENT = "weretail/components/content/image";

    $document.on('dialog-ready', handlePathField);

    function handlePathField(){
        var $linkUrl = $("foundation-autocomplete[name='" + LINK_URL + "']"),
            gAuthor = Granite.author,
            editable = gAuthor.DialogFrame.currentDialog.editable;

        //if not an weretail image component dialog, return
        if((editable.type !== COMPONENT) || _.isEmpty($linkUrl)){
            return;
        }

        var pathField = $linkUrl[0];

        extendPicker(pathField);
    }

    function extendPicker(pathField){
        var origShowPicker = pathField._showPicker;

        pathField._showPicker = function(){
            origShowPicker.call(this);

            var columnView = $(this._picker.el).find("coral-columnview")[0];

            columnView.on("coral-columnview:navigate", filterContent);
        }
    }

    function filterContent(event){
        var $item, currentPath = $(event.detail.activeItem).data("foundationCollectionItemId");

        $.ajax(currentPath + ".3.json").done(handler);

        function handler(assetsJson){
            $(event.detail.column).find("coral-columnview-item").each(function(index, item){
                $item = $(item);

                if(isValid(assetsJson, $item)){
                    return;
                }

                $item.remove();
            });
        }
    }

    function isValid(assetsJson, $item){
        var itemPath = $item.data("foundationCollectionItemId"),
            itemName = itemPath.substring(itemPath.lastIndexOf("/") + 1),
            assetMetadata = assetsJson[itemName];

        if($item.attr("variant") == "drilldown"){ // a folder
            return true;
        }

        if(!assetMetadata || !assetMetadata["jcr:content"] || !assetMetadata["jcr:content"]["metadata"]
                || !assetMetadata["jcr:content"]["metadata"]["dc:creator"]){
            return false;
        }

        return true;
    }
}(jQuery, jQuery(document)));