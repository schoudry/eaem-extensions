(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        GRANITE_OMNI_SEARCH_RESULT = "#granite-omnisearch-result",
        EAEM_SEARCH_PATH_COLUMN = "eaem-search-path-column",
        EAEM_SEARCH_PATH_COLUMN_HEADER = "Path",
        ROW_SELECTOR = "tr.foundation-collection-item",
        EAEM_SORT_PARAMETER = "eaem-search-parameter",
        SORT_DIRECTION_STORAGE_KEY = "apps.experienceaem.assets.searchSortDirection",
        STORAGE = window.localStorage,
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content";

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        _.defer(function(){
            handleContentLoad(event);
        });
    });

    $document.ready(function(){
        addSortParameter($(GRANITE_OMNI_SEARCH_CONTENT), "nodename", "asc");
    });

    function addSortParameter($form, parameter, direction){
        var $sortParam = $form.find("." + EAEM_SORT_PARAMETER);

        if(!_.isEmpty($sortParam)){
            $sortParam.remove();
        }

        $form.append(getSortHtml(parameter, direction));
    }

    function getSortHtml(parameter, direction){
        return  "<span class='" + EAEM_SORT_PARAMETER + "' >" +
                    "<input type='hidden' name='orderby' value='" + parameter + "'/>" +
                    "<input type='hidden' name='orderby.sort' value='" + direction + "'/>" +
                "</span>"
    }

    function handleContentLoad(event){
        var layout = $(GRANITE_OMNI_SEARCH_RESULT).data("foundationLayout");

        if(!layout || (layout.layoutId !== "list")){
            return;
        }

        addColumnHeaders();

        fillColumnData();
    }

    function handleSort(){
        var $form = $(GRANITE_OMNI_SEARCH_CONTENT),
            $th = $(this),
            direction = $th.attr("sortabledirection");

        if(direction == "ascending"){
            $th.attr("sortabledirection", "descending");
            direction = "desc";
        }else{
            $th.attr("sortabledirection", "ascending");
            direction = "asc";
        }

        STORAGE.setItem(SORT_DIRECTION_STORAGE_KEY, direction);

        addSortParameter($form, "nodename", direction);

        $form.submit();
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
            $headRow = $container.find("thead > tr"), direction = "ascending";

        $headRow.append(getTableHeader(EAEM_SEARCH_PATH_COLUMN_HEADER));

        if(STORAGE.getItem(SORT_DIRECTION_STORAGE_KEY) == "desc"){
            direction = "descending";
        }

        $headRow.find("th:eq(" + getIndex($headRow, "Name") + ")")
                .attr("sortabledirection", direction)
                .attr("sortable", "sortable").click(handleSort);

        STORAGE.removeItem(SORT_DIRECTION_STORAGE_KEY);

        $headRow.find("th:eq(" + getIndex($headRow, "Modified") + ")").attr("sortable", "sortable").click(handleSort);
    }

    function getIndex($headRow, header){
        return $headRow.find("th coral-table-headercell-content:contains('" + header + "')").closest("th").index();
    }

    function getTableHeader(colText) {
        return '<th is="coral-table-headercell" sortable ' + EAEM_SEARCH_PATH_COLUMN + ' >' + colText + '</th>';
    }

    function checkIFHeadersAdded(){
        return !_.isEmpty($(GRANITE_OMNI_SEARCH_CONTENT).find("tr").find("[" + EAEM_SEARCH_PATH_COLUMN + "]"));
    }
})(jQuery, jQuery(document));