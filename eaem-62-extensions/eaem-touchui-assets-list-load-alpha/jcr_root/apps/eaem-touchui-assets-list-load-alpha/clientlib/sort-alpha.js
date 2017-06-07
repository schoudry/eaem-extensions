(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        FOUNDATION_MODE_CHANGE = "foundation-mode-change",
        LAYOUT_LIST_VIEW = "list",
        TITLE_COLUMN = "Title",
        DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages";

    $document.on(FOUNDATION_CONTENT_LOADED, sortListItems);

    $document.on(FOUNDATION_MODE_CHANGE, sortListItems);

    function sortListItems(event){
        var $childPage = $(DAM_ADMIN_CHILD_PAGES),
            foundationLayout = $childPage.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return;
        }

        var layoutId = foundationLayout.layoutId;

        if(layoutId !== LAYOUT_LIST_VIEW){
            return;
        }

        var $listViewHead = $childPage.find("thead");

        var $colSpan = $listViewHead.find("coral-th-label:contains('" + TITLE_COLUMN + "')").filter(function(){
            return ($(this).text() === TITLE_COLUMN);
        });

        $colSpan.closest("th").click();
    }
})(jQuery, $(document));