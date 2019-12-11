(function ($, $document) {
    var EAEM_SORTED = "eaem-sorted";

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
        function alphaSortHandler(event, href){
            if(_.isEmpty(href)){
                return;
            }

            var columnData = columnView._data[href];

            if(_.isEmpty(columnData)){
                return;
            }

            var $columnData = $(columnData);

            alphaSort($columnData);

            columnView._data[href] = $columnData[0].outerHTML;
        }

        function alphaSort($columnData){
            var $cContent = $columnData.find(".coral-ColumnView-column-content"),
                $items = $cContent.find(".coral-ColumnView-item");

            if(!_.isEmpty($cContent.data(EAEM_SORTED))){
                return;
            }

            $items.sort(function(a, b) {
                var aTitle = a.getAttribute("title"),
                    bTitle = b.getAttribute("title");

                return (bTitle.toUpperCase()) < (aTitle.toUpperCase()) ? 1 : -1;
            });

            $cContent.data(EAEM_SORTED, "true");

            $items.detach().appendTo($cContent);
        }

        columnView.$element.on('coral-columnview-load', alphaSortHandler);

        alphaSort(columnView.$element);
    }

}(jQuery, jQuery(document)));
