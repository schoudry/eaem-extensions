(function ($, $document) {
    var SELECT_RES_TYPE = "granite/ui/components/coral/foundation/form/select",
        SLING_RES_TYPE = "sling:resourceType";

    $document.on("dialog-ready", handleCoralSelect);

    function handleCoralSelect(){
        $.ajax(getDialogPath() + ".infinity.json").done(handler);

        function handler(data) {
            var selectItems = {}, $widget;

            fillItemsOfSelect(data, selectItems);

            _.each(selectItems, function(items, selectName){
                $widget = $("[name='" + selectName + "']");

                if(_.isEmpty($widget)){
                    return;
                }

                addImagesInCoralSelect($widget, items);
            });
        }
    }

    function getDialogPath(){
        var gAuthor = Granite.author,
            currentDialog = gAuthor.DialogFrame.currentDialog, dialogPath ;

        if(currentDialog instanceof gAuthor.actions.PagePropertiesDialog){
            var dialogSrc = currentDialog.getConfig().src;
            dialogPath = dialogSrc.substring(0, dialogSrc.indexOf(".html"));
        }else{
            var editable = gAuthor.DialogFrame.currentDialog.editable;

            if(!editable){
                console.log("EAEM - editable not available");
                return;
            }

            dialogPath = editable.config.dialog;
        }

        return dialogPath;
    }

    function addImagesInCoralSelect($widget, items){
        var adjustCss = false, $item;

        _.each(items, function(item){
            if(!item.image){
                return;
            }

            adjustCss = true;

            $item = $widget.find("coral-select-item[value='" + item.value + "']");

            if(_.isEmpty($item)){
                return;
            }

            $item.prepend("<img src='" + item.image + "' align='middle' width='30px' height='30px' style='margin-right: 5px; '/>" );
        });

        if(adjustCss){
            $widget.find("button").css("padding", "0 0 0 10px");
        }
    }


    function fillItemsOfSelect(data, selectItems){
        if(!_.isObject(data) || _.isEmpty(data)){
            return selectItems;
        }

        _.each(data, function(value, key){
            if(_.isObject(value) && !_.isEmpty(value)){
                selectItems = fillItemsOfSelect(value, selectItems);
            }else{
                if( (key == SLING_RES_TYPE) && (value == SELECT_RES_TYPE)){
                    selectItems[data.name] = data.items;
                }
            }
        });

        return selectItems;
    }
}(jQuery, jQuery(document)));