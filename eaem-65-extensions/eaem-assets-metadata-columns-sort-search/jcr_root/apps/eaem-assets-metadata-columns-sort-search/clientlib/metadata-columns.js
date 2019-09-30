(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        GRANITE_OMNI_SEARCH_RESULT = "#granite-omnisearch-result",
        EAEM_METADATA_REL_PATH = "data-eaem-metadata-rel-path",
        ROW_SELECTOR = "tr.foundation-collection-item",
        EAEM_SEARCH_PATH_COLUMN_HEADER = "Path",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content",
        EAEM_META_COLUMNS_URL = "/apps/eaem-assets-metadata-columns-sort-search/columns.1.json",
        STORAGE = window.localStorage,
        EAEM_SORT_PARAMETER = "eaem-search-parameter",
        SORT_DIRECTION_STORAGE_KEY = "apps.eaem.assets.searchSortDirection",
        PARSER_KEY = "foundation.adapters.internal.adapters.foundation-util-htmlparser",
        metaParams = {}, sortHandlersAdded = false;

    loadCustomColumnHeaders();

    extendHtmlParser();

    $document.ready(function(){
        var $form = $(GRANITE_OMNI_SEARCH_CONTENT);

        STORAGE.removeItem(SORT_DIRECTION_STORAGE_KEY);

        addSortParameter($form, "nodename", "asc");
    });

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        _.defer(function(){
            handleContentLoad(event);
        });
    });

    function handleContentLoad(event){
        var layout = $(GRANITE_OMNI_SEARCH_RESULT).data("foundationLayout");

        if(sortHandlersAdded || !layout || (layout.layoutId !== "list")){
            return;
        }

        sortHandlersAdded = true;

        var $container = $(GRANITE_OMNI_SEARCH_CONTENT),
            $headRow = $container.find("thead > tr"),
            sortBy = STORAGE.getItem(SORT_DIRECTION_STORAGE_KEY), direction;

        if(_.isEmpty(sortBy)){
            sortBy = "nodename";
            direction = "ascending";
        }else{
            direction = sortBy.substring(sortBy.lastIndexOf("=") + 1);
            sortBy = sortBy.substring(0, sortBy.lastIndexOf("="));
        }

        addSortHandler($headRow,"Name", "nodename", sortBy, direction);

        addSortHandler($headRow,"Modified", "@jcr:content/jcr:lastModified", sortBy, direction);

        addSortHandler($headRow,"EAEM Desc", "@jcr:content/metadata/eaemDesc", sortBy, direction);

        addSortHandler($headRow,"EAEM Keywords", "@jcr:content/metadata/eaemKeywords", sortBy, direction);

        addSortHandler($headRow,"EAEM Title", "@jcr:content/metadata/eaemTitle", sortBy, direction);
    }

    function removeSortParameter(){
        var $form = $(GRANITE_OMNI_SEARCH_CONTENT),
            $sortParam = $form.find("." + EAEM_SORT_PARAMETER);

        if(!_.isEmpty($sortParam)){
            $sortParam.remove();
        }
    }

    function addSortParameter($form, parameter, direction){
        removeSortParameter();

        $form.append(getSortHtml(parameter, direction));
    }

    function getSortHtml(parameter, direction){
        return  "<span class='" + EAEM_SORT_PARAMETER + "' >" +
                    "<input type='hidden' name='orderby' value='" + parameter + "'/>" +
                    "<input type='hidden' name='orderby.sort' value='" + direction + "'/>" +
                "</span>"
    }

    function addSortHandler($headRow, header, sortBy, metaPath, direction){
        var $col = $headRow.find("th:eq(" + getIndex($headRow, header) + ")")
            .attr("sortabledirection", "default")
            .attr("sortable", "sortable").click(handleSort);

        if(sortBy == metaPath){
            $col.attr("sortabledirection", direction)
        }

        return $col;
    }

    function handleSort(){
        var $form = $(GRANITE_OMNI_SEARCH_CONTENT),
            $th = $(this), sortBy = "nodename",
            thContent = $th.find("coral-table-headercell-content").html().trim(),
            direction = "ascending";

        if($th.attr("sortabledirection") == "ascending"){
            direction = "descending";
        }

        $th.attr("sortabledirection", direction);

        if(thContent == "Modified"){
            sortBy = "@jcr:content/jcr:lastModified";
        }else if(thContent == "EAEM Title"){
            sortBy = "@jcr:content/metadata/eaemTitle";
        }else if(thContent == "EAEM Desc"){
            sortBy = "@jcr:content/metadata/eaemDesc";
        }else if(thContent == "EAEM Keywords"){
            sortBy = "@jcr:content/metadata/eaemKeywords";
        }

        STORAGE.setItem(SORT_DIRECTION_STORAGE_KEY, sortBy + "=" + direction);

        addSortParameter($form, sortBy, (direction == "descending" ? "desc" : "asc"));

        $form.submit();
    }

    function extendHtmlParser(){
        var htmlParser = $(window).data(PARSER_KEY),
            otbParse = htmlParser.instance.parse;

        htmlParser.instance.parse = function(html, avoidMovingExisting){
            var $parsedResponse = $(html);

            if(!_.isEmpty($parsedResponse.find(GRANITE_OMNI_SEARCH_RESULT))){
                sortHandlersAdded = false;

                addCustomHeaders($parsedResponse);

                fillColumnData(fetchCustomColumnValues(), $parsedResponse);
            }else if( GRANITE_OMNI_SEARCH_RESULT == ("#" + $parsedResponse.attr("id"))){
                fillColumnData(fetchCustomColumnValues(), $parsedResponse);

                html = $parsedResponse[0].outerHTML;
            }

            return otbParse.call(htmlParser.instance, html, avoidMovingExisting);
        }
    }

    function addCustomHeaders($parsedResponse){
        var $container = $parsedResponse.find(GRANITE_OMNI_SEARCH_RESULT),
            $headRow = $container.find("thead > tr");

        if(_.isEmpty($headRow)){
            return;
        }

        _.each(metaParams, function(header, metaPath){
            $headRow.append(getTableHeader(header, metaPath));
        });

        $(getTableHeader(EAEM_SEARCH_PATH_COLUMN_HEADER, "jcr:path")).appendTo($headRow);
    }

    function fillColumnData(results, $parsedResponse){
        $parsedResponse.find(ROW_SELECTOR).each(function(index, item){
            itemHandler($(item) );
        });

        function itemHandler($row){
            if(!_.isEmpty($row.find("[" + EAEM_METADATA_REL_PATH + "]"))){
                return;
            }

            if(_.isEmpty($row.find("td.foundation-collection-item-title"))){
                return;
            }

            var itemPath = $row.data("foundation-collection-item-id"),
                metadata, metaProp, $td = $row.find("td:last");

            _.each(metaParams, function(header, metaPath){
                metadata = (results[itemPath] || {});

                metaProp = metaPath.substring(metaPath.lastIndexOf("/") + 1);

                $td = $(getListCellHtml(metaPath, metadata[metaProp])).insertAfter($td);
            });

            $td = $(getListCellHtml("jcr:path", itemPath)).insertAfter($td);

            $(getEmptyListCell()).insertAfter($td);
        }
    }

    function fetchCustomColumnValues() {
        var $form = $("form.foundation-form"), results = {},
            query = "/bin/querybuilder.json?" + $form.serialize();

        query = query + "&999_property=jcr:primaryType&999_property.value=dam:Asset&p.hits=selective&p.limit=-1&p.properties=jcr:path";

        query = query + "+" + Object.keys(metaParams).join("+");

        $.ajax({ url: query, async: false }).done(function(data){
            if(!data || (data.results <= 0) ){
                return;
            }

            _.each(data.hits, function(hit){
                results[hit["jcr:path"]] = hit["jcr:content"]["metadata"];
            });
        });

        return results;
    }

    function getEmptyListCell(){
        return '<td is="coral-table-cell" style="display:none"></td>';
    }

    function getIndex($headRow, header){
        return $headRow.find("th coral-table-headercell-content:contains('" + header + "')").closest("th").index();
    }

    function getListCellHtml(metaPath, metaValue){
        metaValue = (metaValue || "");

        return '<td is="coral-table-cell" ' + EAEM_METADATA_REL_PATH + '="' + metaPath + '" >' + metaValue + '</td>';
    }

    function getTableHeader(colText, metadataPath) {
        return '<th is="coral-table-headercell" ' + EAEM_METADATA_REL_PATH + '="' + metadataPath  + '" >' + colText + '</th>';
    }

    function loadCustomColumnHeaders(){
        $.ajax( { url: EAEM_META_COLUMNS_URL, async: false} ).done(function(data){
            _.each(data, function(colData){
                if(_.isEmpty(colData.header) || _.isEmpty(colData.metadataPath)){
                    return;
                }

                metaParams[colData.metadataPath] = colData.header;
            });
        });
    }
})(jQuery, jQuery(document));