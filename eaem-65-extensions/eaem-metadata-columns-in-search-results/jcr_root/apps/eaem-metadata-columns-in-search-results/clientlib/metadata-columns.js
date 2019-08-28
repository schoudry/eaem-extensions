(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        GRANITE_OMNI_SEARCH_RESULT = "#granite-omnisearch-result",
        EAEM_METADATA_REL_PATH = "data-eaem-metadata-rel-path",
        ROW_SELECTOR = "tr.foundation-collection-item",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content",
        EAEM_META_COLUMNS_URL = "/apps/eaem-metadata-columns-in-search-results/columns.1.json",
        metaParams = {}, results = {};

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        _.defer(function(){
            handleContentLoad(event);
        });
    });

    loadCustomColumnHeaders();

    function handleContentLoad(event){
        var layout = $(GRANITE_OMNI_SEARCH_RESULT).data("foundationLayout");

        if(!layout || (layout.layoutId !== "list")){
            return;
        }

        addColumnHeaders();

        fillColumnData(results);
    }

    function addColumnHeaders(){
        if(checkIFHeadersAdded()){
            return;
        }

        var $fui = $(window).adaptTo("foundation-ui");

        $fui.wait();

        var $container = $(GRANITE_OMNI_SEARCH_CONTENT),
            $headRow = $container.find("thead > tr");

        _.each(metaParams, function(header, metaPath){
            $headRow.append(getTableHeader(header, metaPath));
        });

        $fui.clearWait();
    }

    function addOnFormSubmitListener() {
        var $form = $("form.foundation-form");

        $form.on("foundation-form-submitted", handler);

        function handler(event, success, xhr){
            if (!success) {
                return;
            }

            var query = "/bin/querybuilder.json?" + $(this).serialize();

            query = query + "&999_property=jcr:primaryType&999_property.value=dam:Asset&p.hits=selective&p.limit=-1&p.properties=jcr:path";

            query = query + "+" + Object.keys(metaParams).join("+");

            $.ajax({ url: query, async: false }).done(handleResults);
        }
    }

    function handleResults(data){
        if(!data || (data.results <= 0) ){
            return;
        }
        var $fui = $(window).adaptTo("foundation-ui");

        $fui.wait();

        results = {};

        _.each(data.hits, function(hit){
            results[hit["jcr:path"]] = hit["jcr:content"]["metadata"];
        });

        $fui.clearWait();
    }

    function fillColumnData(results){
        var $fui = $(window).adaptTo("foundation-ui");

        $fui.wait();

        $(ROW_SELECTOR).each(function(index, item){
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
        }

        $fui.clearWait();
    }

    function getListCellHtml(metaPath, metaValue){
        metaValue = (metaValue || "");

        return '<td is="coral-table-cell" ' + EAEM_METADATA_REL_PATH + '="' + metaPath + '" >' + metaValue + '</td>';
    }

    function loadCustomColumnHeaders(){
        addOnFormSubmitListener();

        $.ajax( { url: EAEM_META_COLUMNS_URL, async: false} ).done(function(data){
            _.each(data, function(colData){
                if(_.isEmpty(colData.header) || _.isEmpty(colData.metadataPath)){
                    return;
                }

                metaParams[colData.metadataPath] = colData.header;
            });
        });
    }

    function getTableHeader(colText, metadataPath) {
        return '<th is="coral-table-headercell" ' + EAEM_METADATA_REL_PATH + '="' + metadataPath  + '" >' + colText + '</th>';
    }

    function checkIFHeadersAdded(){
        return !_.isEmpty($(GRANITE_OMNI_SEARCH_CONTENT).find("thead > tr").find("[" + EAEM_METADATA_REL_PATH + "]"));
    }
})(jQuery, jQuery(document));