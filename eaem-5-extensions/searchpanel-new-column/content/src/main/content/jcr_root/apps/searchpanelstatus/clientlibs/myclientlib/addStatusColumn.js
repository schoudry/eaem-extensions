CQ.Ext.ns("MyClientLib");

MyClientLib.SearchPanel = {
    addStatusColumn: function(){
        CQ.wcm.SiteAdminSearchPanel.COLUMNS["status"] =  {
            "header":CQ.I18n.getMessage("Status"),
            "id":"status",
            "dataIndex":"xxxxx", //some undefined, to workaround grid weird layout issue
            "renderer": function(val, meta, rec) {
                if(!rec.data.scheduledTasks){
                    return "";
                }

                var qtip = "<table class='qtip-table'><tr><th>" + CQ.I18n.getMessage("Task")
                                + "</th><th>" + CQ.I18n.getMessage("Scheduled") + "</th><th>";

                CQ.Ext.each(rec.data.scheduledTasks, function(t){
                    var iconCls = (t.type == 'ACTIVATE') ? "status status-scheduledtask-activation" :
                                        "status status-scheduledtask-deactivation";

                    qtip = qtip + "<tr><td class='" + iconCls + "'></td><td>"
                                    + t.dt + " (" + t.ini + ")</td><td>";
                });

                qtip = qtip + "</table>";

                return "<span class=\"status status-scheduledtask\" ext:qtip=\"" + qtip + "\">&nbsp;</span>";
            }
        };

        MyClientLib.SiteAdminSearchPanel = CQ.Ext.extend(CQ.wcm.SiteAdminSearchPanel, {
            constructor: function(config) {
                if (config.columns) {
                    config.columns.push({
                        "xtype" : "gridcolumn",
                        "usePredefined": "status"
                    });
                }
                MyClientLib.SiteAdminSearchPanel.superclass.constructor.call(this, config);
            }
        });

        CQ.Ext.reg("siteadminsearchpanel", MyClientLib.SiteAdminSearchPanel);
    },

    addSchdTasksInStore: function(grid){
        var store = grid.getStore();

        store.on('load', function(s, recs){
            var pages = "";
            var updateRecs = {};

            CQ.Ext.each(recs, function(r){
                pages = pages + r.id + ",";
                updateRecs[r.id] = r;
            });

            if(!pages){
                return;
            }

            pages = pages.substr(0, pages.lastIndexOf(","));

            $.ajax({
                url: '/bin/mycomponents/schtasks',
                dataType: "json",
                type: 'GET',
                async: false,
                data: { "path" : pages, "type" : "ALL" },
                success: function(data){
                    if(!data || !data["data"]){
                        return;
                    }

                    data = data["data"];
                    var rec;

                    CQ.Ext.each(data, function(d){
                        rec = updateRecs[d["path"]];

                        if(!rec.data.scheduledTasks){
                            rec.data.scheduledTasks = [];
                        }

                        rec.data.scheduledTasks.push(d);
                    });
                }
            });

            grid.getView().refresh();
        });
    }
};

(function(){
    MyClientLib.SearchPanel.addStatusColumn();

    if(window.location.pathname == "/siteadmin"){
        var SA_INTERVAL = setInterval(function(){
            var grid = CQ.Ext.getCmp("cq-siteadminsearchpanel-grid");

            if(grid && (grid.rendered == true)){
                clearInterval(SA_INTERVAL);
                MyClientLib.SearchPanel.addSchdTasksInStore(grid);
            }
        }, 250);

    }
})();