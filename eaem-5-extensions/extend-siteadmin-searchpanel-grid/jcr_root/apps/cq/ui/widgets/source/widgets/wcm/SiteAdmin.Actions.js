$.getScript("/libs/cq/ui/widgets/source/widgets/wcm/SiteAdmin.Actions.js", function(){
    var INTERVAL = setInterval(function(){
        var grid = CQ.Ext.getCmp("cq-siteadminsearchpanel-grid");

        if(grid){
            clearInterval(INTERVAL);

            var toolBar = grid.getTopToolbar();
            var createInPath = "/content/drafts/admin";

            toolBar.insertButton(1, new CQ.Ext.Toolbar.Button({
                text: 'New Page',
                cls: "cq-siteadmin-create",
                iconCls: "cq-siteadmin-create-icon",
                handler : function(){
                    var dialog = CQ.wcm.Page.getCreatePageDialog(createInPath);
                    dialog.show();
                }
            }));

            grid.doLayout();
        }
    }, 250);
});
