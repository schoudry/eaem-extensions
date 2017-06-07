(function(){
    if(window.location.pathname !== "/damadmin"){
        return;
    }

    // yes cq-siteadminsearchpanel-grid is dam search panel grid in /damadmin
    var DA_GRID = "cq-siteadminsearchpanel-grid",
        TITLE = "title";

    var DA_INTERVAL = setInterval(function(){
        var grid = CQ.Ext.getCmp(DA_GRID);

        if(grid && (grid.rendered == true)){
            clearInterval(DA_INTERVAL);
            addTitleColumn(grid);
        }
    }, 250);

    function addTitleColumn(grid) {
        var cm = grid.getColumnModel();

        var tColumn = new CQ.Ext.grid.Column({
            "header": "Title",
            "id": TITLE,
            width: 100,
            "renderer": function (v, params, record) {
                if(!record || !record.json || !record.json["jcr:content"]){
                    return "";
                }

                var metadata = record.json["jcr:content"]["metadata"];

                if(metadata){
                    return metadata["dc:title"];
                }
            }
        });

        cm.columns.splice(2, 0, tColumn);

        cm.lookup[TITLE] = tColumn;
    }
})();
