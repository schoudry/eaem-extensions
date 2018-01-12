(function ($, $document) {
    var PAGE_BROWSER = "/apps/eaem-touchui-sidepanel-pagetree/page-browser/content/tree-wrapper.html",
        pageTreeAdded = false;

    $document.on('cq-layer-activated', addPageTree);

    function addPageTree(event){
        if(pageTreeAdded || (event.layer !== "Edit")){
            return;
        }

        var sidePanel = Granite.author.ui.SidePanel,
            tabList = sidePanel._tabView.tabList;

        tabList.items.add({
            title: "Page Tree",
            label: {
                innerHTML: '<coral-icon icon="pages" size="S"/>'
            }
        });

        var panelstack = sidePanel._tabView.panelStack;

        panelstack.items.add({
            content: {
                innerHTML: getPageContent()
            }
        });

        pageTreeAdded = true;
    }

    function getPageContent(){
        return "<div class='sidepanel-tab'>" +
                    "<span class='sidepanel-tab-title'>Page Tree</span>" +
                    "<iframe src='" + PAGE_BROWSER + "' style='border:none' height='800px'></iframe>" +
                "</div>";
    }
})(jQuery, jQuery(document));