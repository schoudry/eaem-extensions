(function ($, $document, gAuthor) {
    if(!gAuthor){
        return;
    }

    $document.on('dialog-ready', handlePathBrowser);

    function handlePathBrowser(){
        var $cuiPathBrowser = $(".coral-PathBrowser");

        if(_.isEmpty($cuiPathBrowser)){
            return;
        }

        //handle picker columns
        $cuiPathBrowser.each(extendPicker);
    }

    function extendPicker(index, cuiPathBrowser){
        cuiPathBrowser = $(cuiPathBrowser).data("pathBrowser");

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
            if(_.isEmpty(href) || _.isEmpty(data)){
                return;
            }

            var $item, assetPath, thumbHtml,
                columnData = columnView._data[href];

            if(_.isEmpty(columnData)){
                return;
            }

            var $columnData = $(columnData), $items = $columnData.find(".coral-ColumnView-item");

            $items.each(function(index, item){
                $item = $(item);

                assetPath = $item.data("value");

                if(_.isEmpty(assetPath)){
                    return;
                }

                thumbHtml = getThumbHtml(assetPath);

                if(!thumbHtml){
                    return;
                }

                $item.find(".coral-ColumnView-icon").html(thumbHtml);
            });

            columnView._data[href] = $columnData[0].outerHTML;
        }

        columnView.$element.on('coral-columnview-load', handler);
    }

    function getThumbHtml(assetPath){
        var assetExt = getStringAfterLastDot(assetPath);

        if(!assetExt){
            return "";
        }

        return '<img class="foundation-collection-item-thumbnail" src="'
                    + assetPath + '/_jcr_content/renditions/cq5dam.thumbnail.48.48.png" width="40px" height="40px" style="margin-right:10px" '
                    + 'alt="' + getStringAfterLastSlash(assetPath) + '">';
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }

    function getStringAfterLastDot(str){
        if(!str || (str.indexOf(".") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf(".") + 1);
    }

}(jQuery, jQuery(document), Granite.author));