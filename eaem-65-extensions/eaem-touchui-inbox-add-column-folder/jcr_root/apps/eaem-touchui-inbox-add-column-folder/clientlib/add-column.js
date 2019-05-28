(function($, $document){
    var _ = window._,
        INBOX_UI_PAGE_VANITY = "/aem/inbox",
        INBOX_UI_PAGE = "/mnt/overlay/cq/inbox/content/inbox.html",
        LAYOUT_LIST_VIEW = "list",
        columnAdded = false;

    //$document.on("foundation-contentloaded", addColumn);

    function isInboxPage() {
        var pathName = window.location.pathname;
        return ((pathName.indexOf(INBOX_UI_PAGE) >= 0) || (pathName.indexOf(INBOX_UI_PAGE_VANITY) >= 0));
    }

    function addColumn(){
        if(!isInboxPage() || columnAdded){
            return;
        }

        var $thead = $("thead");

        if(_.isEmpty($thead)){
            return;
        }

        columnAdded = true;

        $thead.find("tr").append(getFolderColumnHeader());

        addContent();
    }

    function addContent(){
        var $table = $("table"),
            foundationLayout = $table.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return;
        }

        var layoutId = foundationLayout.layoutId;

        if(layoutId !== LAYOUT_LIST_VIEW){
            return;
        }

        $(".foundation-collection-item").each(function(index, item){
            itemHandler($(item) );
        });
    }

    function itemHandler($item){
        var payLoadLink = $item.data("payload-link");

        $item.append(getListCellHtml(_.isEmpty(payLoadLink) ? "" : payLoadLink.substring(payLoadLink.indexOf("/content"))));
    }

    function getListCellHtml(itemName){
        return '<td is="coral-table-cell">' + itemName + '</td>';
    }

    function getFolderColumnHeader(){
        return '<th is="coral-table-headercell">Path</th>';
    }
}(jQuery, jQuery(document)));