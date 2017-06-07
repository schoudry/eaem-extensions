Ext.onReady(function(){
    var INTERVAL = setInterval(function(){
        var searchField = Ext.getCmp(CRX.ide.REPO_PATH_ID);

        if(searchField){
            clearInterval(INTERVAL);

            searchField.setDisabled(true);
        }
    }, 250);

    var SB_INTERVAL = setInterval(function(){
        var homePanel = Ext.getCmp("editors");

        if(homePanel){
            clearInterval(SB_INTERVAL);

            homePanel.findByType("panel")[0].setDisabled(true);
        }
    }, 250);
});