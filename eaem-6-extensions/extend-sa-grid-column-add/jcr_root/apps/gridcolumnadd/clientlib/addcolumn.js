CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.SiteAdminGrid = {
    SA_GRID: "cq-siteadmin-grid",
    TEMPLATE_PATH: "templatePath",

    addPathColumn: function(grid){
        var cm = grid.getColumnModel();

        var tPathColumn = new CQ.Ext.grid.Column({
            "header": "Template Path",
            "id":"templatePath",
            "dataIndex":"templatePath",
            "renderer": function(v, params, record) {
                return v;
            }
        });

        cm.columns.push(tPathColumn);

        cm.lookup[this.TEMPLATE_PATH] = tPathColumn;

        grid.doLayout();
    }
};

(function(){
    if(window.location.pathname !== "/siteadmin"){
        return;
    }

    var s = ExperienceAEM.SiteAdminGrid;

    var SA_INTERVAL = setInterval(function(){
        var grid = CQ.Ext.getCmp(s.SA_GRID);

        if(grid && ( grid.rendered == true)){
            var cm = grid.getColumnModel();

            if(cm && cm.columns){
                clearInterval(SA_INTERVAL);
                s.addPathColumn(grid);
            }
        }
    }, 250);
})();