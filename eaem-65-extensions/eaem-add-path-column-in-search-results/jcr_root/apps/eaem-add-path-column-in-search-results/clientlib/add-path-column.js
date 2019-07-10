(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        GRANITE_OMNI_SEARCH_RESULT = "#granite-omnisearch-result",
        EAEM_SEARCH_PATH_COLUMN = "eaem-search-path-column",
        EAEM_SEARCH_PATH_COLUMN_HEADER = "Path",
        ROW_SELECTOR = "tr.foundation-collection-item",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content";

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        _.defer(function(){
            handleContentLoad(event);
        });
    });

    function handleContentLoad(event){
        var layout = $(GRANITE_OMNI_SEARCH_RESULT).data("foundationLayout");

        if(!layout || (layout.layoutId !== "list")){
            return;
        }

        addColumnHeaders();

        fillColumnData();
    }

    function fillColumnData(){
        var $fui = $(window).adaptTo("foundation-ui");

        $fui.wait();

        $(ROW_SELECTOR).each(function(index, item){
            itemHandler($(item) );
        });

        function itemHandler($row){
            if(!_.isEmpty($row.find("[" + EAEM_SEARCH_PATH_COLUMN + "]"))){
                return;
            }

            if(_.isEmpty($row.find("td.foundation-collection-item-title"))){
                return;
            }

            var itemPath = $row.data("foundation-collection-item-id");

            $row.find("td:last").before(getListCellHtml(itemPath));
        }

        $fui.clearWait();
    }

    function getListCellHtml(colValue){
        return '<td is="coral-table-cell" ' + EAEM_SEARCH_PATH_COLUMN + ' >' + colValue + '</td>';
    }

    function addColumnHeaders(){
        if(checkIFHeadersAdded()){
            return;
        }

        var $container = $(GRANITE_OMNI_SEARCH_CONTENT),
            $headRow = $container.find("thead > tr");

        $headRow.append(getTableHeader(EAEM_SEARCH_PATH_COLUMN_HEADER));
    }

    function getTableHeader(colText) {
        return '<th is="coral-table-headercell" ' + EAEM_SEARCH_PATH_COLUMN + ' >' + colText + '</th>';
    }

    function checkIFHeadersAdded(){
        return !_.isEmpty($(GRANITE_OMNI_SEARCH_CONTENT).find("tr").find("[" + EAEM_SEARCH_PATH_COLUMN + "]"));
    }
})(jQuery, jQuery(document));