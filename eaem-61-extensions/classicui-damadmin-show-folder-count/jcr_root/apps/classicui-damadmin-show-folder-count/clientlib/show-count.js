(function(){
    if(window.location.pathname !== "/damadmin"){
        return;
    }

    var DA_GRID = "cq-damadmin-grid", DA_TREE = "cq-damadmin-tree",
        ASSET_COUNT = "assetCount", assetCountCache = {};

    var DA_INTERVAL = setInterval(function(){
        var grid = CQ.Ext.getCmp(DA_GRID);

        if(grid && ( grid.rendered == true)){
            var cm = grid.getColumnModel(),
                damAdmin = grid.findParentByType("siteadmin");

            if(!cm || !cm.columns) {
                return;
            }

            clearInterval(DA_INTERVAL);

            addCountColumn(grid, damAdmin);

            handleGridClick(grid, damAdmin);

            handleTreeClick(damAdmin)
        }
    }, 250);

    function addCountColumn(grid, damAdmin) {
        var cm = grid.getColumnModel();

        var cColumn = new CQ.Ext.grid.Column({
            "header": "Asset Count",
            "id": "assetCount",
            width: 100,
            "renderer": function (v, params, record) {
                if (_.isEmpty(assetCountCache[record.data.label])) {
                    return "0";
                }

                var assets = _.reject(assetCountCache[record.data.label], function (value, key) {
                    return (key.indexOf("jcr:") == 0) || value["jcr:primaryType"] == "sling:OrderedFolder";
                });

                return Object.keys(assets).length;
            }
        });

        cm.columns.splice(4, 0, cColumn);

        cm.lookup[ASSET_COUNT] = cColumn;

        fetchData(location.hash.substr(1), damAdmin);
    }

    function fetchData(path, damAdmin){
        $.ajax(path + ".2.json").done(function(data){
            assetCountCache = data;
            damAdmin.reloadPages();
        });
    }

    function handleGridClick(grid, damAdmin){
        grid.on("rowdblclick", function(){
            fetchData(this.getSelectionModel().getSelected().id, damAdmin);
        });
    }

    function handleTreeClick(damAdmin){
        var tree = CQ.Ext.getCmp(DA_TREE);

        tree.on("click", function(node){
            fetchData(node.getPath(), damAdmin);
        });
    }
})();