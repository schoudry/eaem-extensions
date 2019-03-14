(function ($, $document) {
    "use strict";
 
    var firstLoad = true,
        LAYOUT_LIST_VIEW = "list",
        VIEWS_COUNT = "VIEWS_COUNT",
        EAEM_ANALYTICS_VIEWS = "eaemAnalyticsViews",
        EAEM_MARKER_CSS = "eaem-fragment-cell",
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        FRAGMENT_VIEWS_TEXT = "Fragment Views",
        SEL_DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages";

    $document.on("cui-contentloaded", function (e) {
        if(!firstLoad){
            return;
        }

        var $childPages = $(e.currentTarget).find(SEL_DAM_ADMIN_CHILD_PAGES);

        if(_.isEmpty($childPages)){
            return;
        }

        firstLoad = false;

        $childPages.trigger(FOUNDATION_CONTENT_LOADED);
    });

    $document.on(FOUNDATION_CONTENT_LOADED, SEL_DAM_ADMIN_CHILD_PAGES, addFragmentViews);

    function addFragmentViews(e){
        if(!e.currentTarget || !isFragmentViewsEnabled()){
            return;
        }

        var $currentTarget = $(e.currentTarget),
            foundationLayout = $currentTarget.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return;
        }

        var layoutId = foundationLayout.layoutId,
            folderPath = getFolderPath();

        if(layoutId !== LAYOUT_LIST_VIEW){
            return;
        }

        $.ajax(folderPath + ".2.json").done(function(data){
            $(".foundation-collection-item").each(function(index, item){
                itemHandler(data, layoutId, $(item) );
            });
        });
    }

    function itemHandler(data, layoutId, $item){
        if(isFragmentViewsAdded($item)){
            return;
        }

        var itemPath = $item.data("foundation-collection-item-id"),
            itemName = getStringAfterLastSlash(itemPath);

        var eaemAnalyticsViews = "";

        if(data[itemName] && data[itemName] && data[itemName]["jcr:content"]
                    && data[itemName]["jcr:content"][EAEM_ANALYTICS_VIEWS]){
            eaemAnalyticsViews = data[itemName]["jcr:content"][EAEM_ANALYTICS_VIEWS];
        }

        $item.append(getListCellHtml().replace("VIEWS_COUNT", eaemAnalyticsViews));

        /*
        if($item.find(".coral3-Icon--dragHandle").length > 0){
            $item.find(".coral3-Icon--dragHandle").closest("td").before(getListCellHtml().replace("VIEWS_COUNT", eaemAnalyticsViews));
        }else{
            $item.append(getListCellHtml().replace("VIEWS_COUNT", eaemAnalyticsViews));
        }
        */
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }

    function getFolderPath(){
        return $(SEL_DAM_ADMIN_CHILD_PAGES).data("foundationCollectionId");
    }

    function getListCellHtml(){
        return '<td is="coral-table-cell" class="coral-Table-cell ' + EAEM_MARKER_CSS + '" alignment="column">VIEWS_COUNT</td>';
    }

    function isFragmentViewsEnabled(){
        var $viewsTd = $(SEL_DAM_ADMIN_CHILD_PAGES).find("thead")
                            .find("coral-table-headercell-content:contains('" + (FRAGMENT_VIEWS_TEXT) + "')");

        return ($viewsTd.length > 0);
    }

    function isFragmentViewsAdded($item){
        return ($item.find("td." + EAEM_MARKER_CSS).length > 0);
    }
})(jQuery, jQuery(document));