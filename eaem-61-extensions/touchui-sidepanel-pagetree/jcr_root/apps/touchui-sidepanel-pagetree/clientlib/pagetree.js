(function ($, $document) {
    var PAGE_BROWSER = "/apps/touchui-sidepanel-pagetree/page-browser/content/tree-wrapper.html",
        pageTreeAdded = false;

    $document.on('cq-layer-activated', addPageTree);

    function addPageTree(event){
        if(pageTreeAdded || (event.layer !== "Edit")){
            return;
        }

        var $sidePanelEdit = $("#SidePanel").find(".js-sidePanel-edit"),
            $tabs = $sidePanelEdit.data("tabs");

        //add the page itree iframe in new tab
        $tabs.addItem({
            tabContent: "Page Browser",
            panelContent: getPageContent(),
            active: false
        });

        pageTreeAdded = true;
    }

    function getPageContent(){
        return "<iframe src='" + PAGE_BROWSER + "' style='border:none' height='800px'></iframe>";
    }
})(jQuery, jQuery(document));