(function ($, $document) {
    $document.on("foundation-contentloaded", handleMovePicker);

    function handleMovePicker(){
        var $cuiPathBrowser = $(".coral-PathBrowser");

        if(_.isEmpty($cuiPathBrowser)){
            return;
        }

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
        function alphaSort(event, href, data){
            if(_.isEmpty(href) || _.isEmpty(data)){
                return;
            }

            var columnData = columnView._data[href];

            if(_.isEmpty(columnData)){
                return;
            }

            var $columnData = $(columnData),
                $cContent = $columnData.find(".coral-ColumnView-column-content"),
                $items = $cContent.find(".coral-ColumnView-item");

            $items.sort(function(a, b) {
                var aTitle = a.getAttribute("title"),
                    bTitle = b.getAttribute("title");

                return (bTitle.toUpperCase()) < (aTitle.toUpperCase()) ? 1 : -1;
            });

            $items.detach().appendTo($cContent);

            columnView._data[href] = $columnData[0].outerHTML;
        }

        columnView.$element.on('coral-columnview-load', alphaSort);
    }

}(jQuery, jQuery(document)));
