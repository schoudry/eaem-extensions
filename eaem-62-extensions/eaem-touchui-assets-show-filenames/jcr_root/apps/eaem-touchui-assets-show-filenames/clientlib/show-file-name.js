(function ($, $document) {
    "use strict";

    var FOUNDATION_MODE_CHANGE = "foundation-mode-change",
        EVENT_COLUMNVIEW_LOAD_ITEMS = "coral-columnview:loaditems",
        FOUNDATION_COLLECTION_ID = "foundation-collection-id",
        FOUNDATION_COLLECTION_ITEM_ID = "foundation-collection-item-id",
        DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages",
        META_TYPE = "data-foundation-collection-meta-type",
        FOUNDATION_COLLECTION_ITEM = ".foundation-collection-item",
        COLUMN_VIEW = "coral-columnview",
        LAYOUT_COL_VIEW = "column",
        LAYOUT_LIST_VIEW = "list",
        LAYOUT_CARD_VIEW = "card";

    $document.on(FOUNDATION_MODE_CHANGE, modeChangeHandler);

    function modeChangeHandler(){
        var folderPath = $(DAM_ADMIN_CHILD_PAGES).data(FOUNDATION_COLLECTION_ID);

        if(_.isEmpty(folderPath)){
            return;
        }

        if(isColumnView()){
            handleColumnView();
        }else if(isCardView()){
            handleCardView();
        }else if(isListView()){
            handleListView();
        }
    }

    function handleColumnView(){
        var $columnView = $(COLUMN_VIEW);

        $columnView.on(EVENT_COLUMNVIEW_LOAD_ITEMS, function(){
            $(FOUNDATION_COLLECTION_ITEM).each(handler);
        });

        function handler(index, item){
            var $item = $(item);

            if($item.data("item-type") !== "asset"){
                return;
            }

            var assetPath = $item.data(FOUNDATION_COLLECTION_ITEM_ID),
                $title = $item.find("coral-columnview-item-content");

            $title.html(getStringAfterLastSlash(assetPath));
        }
    }

    function handleCardView(){
        $(FOUNDATION_COLLECTION_ITEM).each(handler);

        function handler(index, item){
            var $item = $(item);

            if($item.find("[" + META_TYPE + "]").attr(META_TYPE) !== "asset"){
                return;
            }

            var assetPath = $item.data(FOUNDATION_COLLECTION_ITEM_ID),
                $cardTitle =$item.find("coral-card-content > coral-card-title");

            $cardTitle.html(getStringAfterLastSlash(assetPath));
        }
    }

    function handleListView(){
        $(FOUNDATION_COLLECTION_ITEM).each(handler);

        function handler(index, item){
            var $item = $(item);

            if($item.data("item-type") !== "asset"){
                return;
            }

            var assetPath = $item.data(FOUNDATION_COLLECTION_ITEM_ID),
                $title = $item.find(".foundation-collection-item-title");

            $title.html(getStringAfterLastSlash(assetPath));
        }
    }

    function isColumnView(){
        return ( getAssetsConsoleLayout() === LAYOUT_COL_VIEW );
    }

    function isListView(){
        return ( getAssetsConsoleLayout() === LAYOUT_LIST_VIEW );
    }

    function isCardView(){
        return (getAssetsConsoleLayout() === LAYOUT_CARD_VIEW);
    }

    function getAssetsConsoleLayout(){
        var $childPage = $(DAM_ADMIN_CHILD_PAGES),
            foundationLayout = $childPage.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return "";
        }

        return foundationLayout.layoutId;
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }
})(jQuery, jQuery(document));