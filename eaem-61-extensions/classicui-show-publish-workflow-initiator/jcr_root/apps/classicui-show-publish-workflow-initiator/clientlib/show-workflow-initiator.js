(function(){
    if(window.location.pathname !== "/damadmin"){
        return;
    }

    //id defined in /libs/wcm/core/content/siteadmin
    var SA_GRID = "cq-damadmin-grid",
        PUBLISHED_ID = "published",
        PUBLISHING_WORKFLOW = '/etc/workflow/models/request_for_activation/jcr:content/model',
        ALLOWED_CUSHION = 5000,
        QUERY_PREFIX = "/bin/querybuilder.json?path=/etc/workflow/instances" +
                        "&1_property=modelId&1_property.value=" + PUBLISHING_WORKFLOW +
                        "&orderby=@endTime&orderby.sort=desc&p.limit=1&p.nodedepth=1&p.hits=full" +
                        "&2_property=@data/payload/path&2_property.value=";

    var modifyPublished = function(grid){
        var pColumn = grid.getColumnModel().getColumnById(PUBLISHED_ID);

        if(!pColumn){
            return;
        }

        var renderer = pColumn.renderer;

        pColumn.renderer = function(v, params, record) {
            var html = renderer.call(this, v, params, record);

            var replication = record.data.replication;

            if ( !replication || (replication.action != "ACTIVATE")) {
                return html;
            }

            var query = QUERY_PREFIX + record.id;

            //WARNING - for demonstration only - individual queries are not very efficient
            //may take its toll on your damadmin performance
            $.ajax({ url : query, async : false }).done(findInitiator);

            function findInitiator(data){
                if(_.isEmpty(data) || _.isEmpty(data.hits)){
                    return;
                }

                var hit = data.hits[0];

                if( (replication.published - new Date(hit.endTime).getTime()) < ALLOWED_CUSHION ){
                    html = $(html).append(", Requested by - <span style='color:red'>"
                            + hit.initiator + "</span>")[0].outerHTML;
                }
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