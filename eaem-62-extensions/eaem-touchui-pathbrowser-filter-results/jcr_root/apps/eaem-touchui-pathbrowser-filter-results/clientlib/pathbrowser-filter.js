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

        //set the default value to current page path
        setDefaultValue(cuiPathBrowser);

        //handle inline autocomplete results
        extendOptionLoader(cuiPathBrowser);

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
        function handler(){
            var $items = columnView.$element.find(".coral-ColumnView-item"), $item;

            $items.each(function(index, item){
                $item = $(item);

                if(isValid($item.data("value"))){
                    return;
                }

                //remove href link to make it disabled
                $item.attr("data-href", "").css("background-color", "#AAAAAA");
            });
        }

        handler();

        columnView.$element.on('coral-columnview-load', handler);

        columnView.$element.on('coral-columnview-item-select', handler);
    }

    function setDefaultValue(cuiPathBrowser){
        //set the default path to current page path
        cuiPathBrowser._setInputValue(gAuthor.getPageInfoLocation(), true);
    }

    function extendOptionLoader(cuiPathBrowser){
        var optionLoader = cuiPathBrowser.optionLoader;

        cuiPathBrowser.optionLoader = function(path, callback){
            optionLoader.call(this, path, function(data){
                callback(dataFilter(path,data));
            });
        };
    }

    //filter results function
    function dataFilter(path, data){
        var filteredData = [];

        _.each(data, function(value){
            if(!isValid(path + "/" + value)){
                return;
            }

            filteredData.push(value);
        });

        return filteredData;
    }

    //if the search result is not sub path of current page path, consider it invalid
    function isValid(relPath){
        var pagePath = gAuthor.getPageInfoLocation();

        if(relPath.length > pagePath.length){
            if(relPath.indexOf(pagePath) !== 0){
                return false;
            }
        }else{
            if(pagePath.indexOf(relPath) !== 0){
                return false;
            }
        }

        return true;
    }
}(jQuery, jQuery(document), Granite.author));