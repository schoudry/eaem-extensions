(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        ROW_SELECTOR = "tr.foundation-collection-item",
        GRANITE_OMNI_SEARCH_RESULT = "#granite-omnisearch-result",
        COLUMN_LIST = "/etc/experience-aem/omni-search-columns/_jcr_content.list.json",
        COLUMN_CONFIG = {},
        METADATA_MAPPING = "data-metadata-mapping",
        RESULTS_URL = "/bin/eaem/metadataResults.json",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content";

    loadColumnsConfiguration();

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

        $.ajax({
            type: "POST",
            dataType: "json",
            url: RESULTS_URL,
            data: {
                paths: getPaths().join(",")
            }
        }).done(collectionIterate);

        function collectionIterate(data){
            $(ROW_SELECTOR).each(function(index, item){
                itemHandler(data, $(item) );
            });

            $fui.clearWait();
        }

        function itemHandler(data, $row){
            if(!_.isEmpty($row.find("[" + METADATA_MAPPING + "]"))){
                return;
            }

            var itemPath = $row.data("foundation-collection-item-id"), metaValue;

            _.each(COLUMN_CONFIG, function(colName, colMetaPath){
                metaValue = data[itemPath][colMetaPath] || "";
                $row.append(getListCellHtml(colMetaPath, metaValue));
            });
        }
    }

    function getPaths(){
        var paths = [], $item;

        $(ROW_SELECTOR).each(function(index, item){
            $item = $(item);

            if(!_.isEmpty($item.find("td[" + METADATA_MAPPING + "]"))){
                return;
            }

            paths.push($item.data("foundation-collection-item-id"));
        });

        return paths;
    }

    function addColumnHeaders(){
        if(checkIFHeadersAdded()){
            return;
        }

        var headerHtml,
            $container = $(GRANITE_OMNI_SEARCH_CONTENT),
            $headRow = $container.find("thead > tr");

        _.each(COLUMN_CONFIG, function(headerText, metaRelPath){
            headerHtml = getTableHeader(metaRelPath, headerText);
            $headRow.append(headerHtml);
        });
    }

    function checkIFHeadersAdded(){
        return !_.isEmpty($(GRANITE_OMNI_SEARCH_CONTENT).find("tr").find("[" + METADATA_MAPPING + "]"));
    }

    function getListCellHtml(colMapping, colValue){
        return '<td is="coral-td" class="coral-Table-cell coral-Table-cell--left" alignment="column" '
                    + METADATA_MAPPING + '="' + colMapping + '">' +
                    '<coral-td-label class="coral-Table-cellLabel">'
                        + colValue +
                    '</coral-td-label>' +
                '</td>';
    }

    function getTableHeader(colMapping, colText) {
        return '<th is="coral-th" '
            + METADATA_MAPPING + '="' + colMapping + '">'
            + colText
            + '</th>';
    }

    function loadColumnsConfiguration(){
        $.ajax({
            url: COLUMN_LIST
        }).done(function(data){
            _.each(data, function(item){
                COLUMN_CONFIG[item.value] = item.text;
            })
        });
    }
})(jQuery, jQuery(document));