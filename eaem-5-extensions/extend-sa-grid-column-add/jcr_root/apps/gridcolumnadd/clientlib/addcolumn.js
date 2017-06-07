CQ.Ext.ns("MyClientLib");

MyClientLib.SiteAdminGrid = {
    SA_GRID: "cq-siteadmin-grid",

    addPathColumn: function(grid){
        var cm = grid.getColumnModel();

        cm.columns.push({
            "header": "Template Path",
            "id":"templatePath",
            "dataIndex":"templatePath",
            "renderer": function(v, params, record) {
                return v;
            }
        });

        grid.doLayout();
    }
};

(function(){
    var s = MyClientLib.SiteAdminGrid;

    if(window.location.pathname == "/siteadmin"){
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
    }
})();