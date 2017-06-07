CQ.Ext.ns("MyComponents");

MyComponents.ContentFinder = {
    TAB_S7_BROWSE : "cfTab-S7Browse",
    TAB_MOVIES : "cfTab-Movies",
    TAB_PARAGRAPHS : "cfTab-Paragraphs",
    TAB_PARTICIPANTS : "cfTab-Participants",
    TAB_PRODUCTS : "cfTab-Products",
    TAB_MANUSCRIPTS : "cfTab-Manuscripts",
    TAB_IMAGES: "cfTab-Images",
    TAB_BROWSE: "cfTab-Browse",
    TAB_DOCUMENTS: "cfTab-Documents",

    hideTabs: function(){
        var tabPanel = CQ.Ext.getCmp(CQ.wcm.ContentFinder.TABPANEL_ID);
        var c = MyComponents.ContentFinder;

        var tabs = [ c.TAB_S7_BROWSE,c.TAB_MOVIES,c.TAB_PARAGRAPHS, c.TAB_BROWSE, c.TAB_DOCUMENTS,
                        c.TAB_PARTICIPANTS,c.TAB_PRODUCTS,c.TAB_MANUSCRIPTS, c.TAB_IMAGES];

        CQ.Ext.each(tabs, function(t){
            var tab = CQ.Ext.getCmp(t);

            if(tab){
                tabPanel.hideTabStripItem(tab);
            }
        });
    }
};

$.getScript("/libs/cq/ui/widgets/source/widgets/wcm/ContentFinder.js", function(){
    var INTERVAL = setInterval(function(){
        var c = MyComponents.ContentFinder;
        var tabPanel = CQ.Ext.getCmp(CQ.wcm.ContentFinder.TABPANEL_ID);

        if(tabPanel){
            clearInterval(INTERVAL);
            c.hideTabs();
        }
    }, 250);
});

