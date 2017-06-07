CQ.Ext.ns("MyClientLib");

MyClientLib.SiteAdminSearchPanel = {
    SA_SEARCH_PANEL_SEARCH: "cq-siteadminsearchpanel-search",
    SA_SEARCH_PANEL_GRID: "cq-siteadminsearchpanel-grid",

    addTemplateOptions: function(){
        var panel = CQ.Ext.getCmp(this.SA_SEARCH_PANEL_SEARCH);

        //search for template field in search  panel
        var component = panel.findBy(function(comp){
            return comp["propertyName"] == "jcr:content/cq:template";
        }, panel);

        //hide ootb template field in search panel
        component[0].setVisible(false);

        //add the templates predicate
        var templates = new CQ.wcm.OptionsPredicate({
            collapse: "level0",
            hideLabel: true,
            "jcr:primaryType" : "cq:Widget",
            optionsPaths: ["/bin/mycomponents/searchpanel/templates.json"],
            "propertyName":"jcr:content/cq:template"
        });

        panel.add(templates);

        var subPanel = templates.findBy(function(comp){
            return comp["subPanel"] instanceof CQ.Ext.Panel ;
        }, panel)[0];

        //get the checkboxes
        var cBoxes = subPanel.findBy(function(comp){
            return comp instanceof CQ.Ext.form.Checkbox;
        }, panel);

        //add toottip showing template path
        CQ.Ext.each(cBoxes, function(box){
            box.on('afterrender', function(){
                CQ.Ext.QuickTips.register({
                    target: this.id,
                    text: this.inputValue,
                    dismissDelay: 2000
                });
            });
        });

        panel.doLayout();
    }
};

(function(){
    if(window.location.pathname == "/siteadmin"){
        var SA_INTERVAL = setInterval(function(){
            var s = MyClientLib.SiteAdminSearchPanel;
            var grid = CQ.Ext.getCmp(s.SA_SEARCH_PANEL_GRID);

            if(grid && (grid.rendered == true)){
                clearInterval(SA_INTERVAL);
                s.addTemplateOptions();
            }
        }, 250);
    }
})();
