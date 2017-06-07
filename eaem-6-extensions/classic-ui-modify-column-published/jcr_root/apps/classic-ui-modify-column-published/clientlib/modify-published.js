(function(){
    if(window.location.pathname !== "/siteadmin"){
        return;
    }

    //id defined in /libs/wcm/core/content/siteadmin
    var SA_GRID = "cq-siteadmin-grid";
    var PUBLISHED_ID = "published";
    var WAIT_MILLS = 10000;

    var modifyPublished = function(grid){
        var pColumn = grid.getColumnModel().getColumnById(PUBLISHED_ID);

        if(!pColumn){
            return;
        }

        var renderer = pColumn.renderer;

        pColumn.renderer = function(v, params, record) {
            var html = renderer.call(this, v, params, record);

            var replication = record.data.replication;

            if ( !replication || !replication.published || (replication.action != "ACTIVATE")
                        || !replication.numQueued) {
                return html;
            }

            if( (new Date().getTime() - replication.published) > WAIT_MILLS ){
                html = $(html).find("span").css("color", "red").html("Still in Queue...").parent()[0].outerHTML;
            }

            return html;
        };

        grid.store.load();
    };

    var SA_INTERVAL = setInterval(function(){
        var grid = CQ.Ext.getCmp(SA_GRID);

        if(!grid || ( grid.rendered != true)){
            return;
        }

        var cm = grid.getColumnModel();

        if(!cm || !cm.columns){
            return;
        }

        clearInterval(SA_INTERVAL);

        try{
            modifyPublished(grid);
        }catch(err){
            console.log("Error executing modify published column extension");
        }
    }, 250);
})();