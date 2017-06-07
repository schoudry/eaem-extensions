CQ.Ext.ns("MyClientLib");

MyClientLib.SiteAdminSearchPanel = {
    SA_SEARCH_PANEL_MB: 'cq-myclientlib-searchpanel-modified-by',
    SA_SEARCH_PANEL_SEARCH: "cq-siteadminsearchpanel-search",
    SA_SEARCH_PANEL_GRID: "cq-siteadminsearchpanel-grid",
    SA_SEARCH_PANEL: "cq-siteadminsearchpanel",

    addModifiedBy: function(){
        var panel = CQ.Ext.getCmp(this.SA_SEARCH_PANEL_SEARCH);

        var defaults = {
            "predicateName":"property",
            "propertyName":"jcr:content/cq:lastModifiedBy"
        };

        var id = CQ.wcm.PredicateBase.createId(defaults.predicateName);

        panel.add(new CQ.Ext.form.Hidden({
            "name": id,
            "value": defaults.propertyName
        }));

        var aCombo = new CQ.security.AuthorizableSelection({
            id: this.SA_SEARCH_PANEL_MB,
            "name": id + ".value",
            "anchor": "100%",
            "valueField" : "id",
            "displayField" : "name",
            "fieldLabel": CQ.I18n.getMessage("Modified By"),
            "filter" : "users",
            "autoSelect" : true
        });

        panel.add(aCombo);
        panel.doLayout();

        var sPanel = CQ.Ext.getCmp(this.SA_SEARCH_PANEL);
        sPanel.reloadPages();
    }
};

(function(){
    if(window.location.pathname == "/siteadmin"){
        var s = MyClientLib.SiteAdminSearchPanel;

        CQ.Ext.override(CQ.wcm.SiteAdminSearchPanel, {
            reloadPages: function(){
                this.performReset();

                var modBy = CQ.Ext.getCmp(s.SA_SEARCH_PANEL_MB);

                if(modBy){
                    //CQ.shared.User.data["userID"]
                    modBy.setValue(CQ.User.getCurrentUser().getUserID());
                    this.performSearch();
                }
            }
        });

        var INTERVAL = setInterval(function(){
            var grid = CQ.Ext.getCmp(s.SA_SEARCH_PANEL_GRID);

            if(grid && (grid.rendered == true)){
                clearInterval(INTERVAL);
                s.addModifiedBy();
            }
        }, 250);
    }
})();