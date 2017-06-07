CQ.Ext.ns("MyClientLib");

MyClientLib.ContentFinder = {
    TAB_IMAGES: "cfTab-Images",

    openImageInNewTab: function(){
        var tab = CQ.Ext.getCmp(this.TAB_IMAGES);

        if(!tab){
            return;
        }

        var resultsView = tab.findByType("dataview");
        resultsView = resultsView[0];

        resultsView.on('dblclick', function(dView, index, node, eObj){
            var sData = this.store.getAt(index);
            window.open("/damadmin#" + sData.id);
        });
    }
};

(function(){
    if( window.location.pathname == "/cf" ){
        var INTERVAL = setInterval(function(){
            var tabPanel = CQ.Ext.getCmp(CQ.wcm.ContentFinder.TABPANEL_ID);

            if(tabPanel && (tabPanel.rendered == true)){
                clearInterval(INTERVAL);
                var c = MyClientLib.ContentFinder;
                c.openImageInNewTab();
            }
        }, 250);
    }
})();