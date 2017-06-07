(function($){
    if(window.location.pathname != "/siteadmin"){
        return;
    }

    var SA_GRID = "cq-siteadmin-grid",
        WORKFLOW_BUT_TEXT = "Workflow...",
        START_WF_DIALOG_ID = "cq-workflowdialog",
        QUERY = "SELECT * FROM [cq:Page] WHERE ISDESCENDANTNODE([/etc/workflow/models]) AND " +
                "([jcr:content/eaemSitePath] = 'PLACEHOLDER' OR [jcr:content/eaemSitePath] IS NULL)";

    var SA_INTERVAL = setInterval(function(){
        var grid = CQ.Ext.getCmp(SA_GRID);

        if(!grid || ( grid.rendered != true)){
            return;
        }

        clearInterval(SA_INTERVAL);

        var toolBar = grid.getTopToolbar();

        try{
            var wButton = toolBar.find("text", WORKFLOW_BUT_TEXT)[0];

            wButton.on('click', filterWorkflows);
        }catch(err){
            console.log("Error adding workflow button listener");
        }
    }, 250);

    function filterWorkflows(){
        var wMgr = CQ.Ext.WindowMgr, winId;

        var W_INTERVAL = setInterval(function () {
            wMgr.each(function (win) {
                winId = win.id;

                if (winId && (winId.indexOf(START_WF_DIALOG_ID) < 0)) {
                    return;
                }

                var modelCombo = CQ.Ext.getCmp(winId + "-model");

                if(modelCombo.eaemInit){
                    return;
                }

                clearInterval(W_INTERVAL);

                modelCombo.eaemInit = true;

                var contentPath = window.location.hash.split("#")[1],
                    //you may want to replace the following query with a servlet returning results
                    query = "/crx/de/query.jsp?type=JCR-SQL2&showResults=true&stmt=" + QUERY.replace('PLACEHOLDER', contentPath);

                $.ajax( { url: query, context: modelCombo } ).done(filter);
            });
        }, 250);

        function filter(data){
            function handler(store, recs){
                var paths = _.pluck(data.results, "path"), modelId;

                _.each(recs, function (rec){
                    modelId = rec.data.wid;
                    modelId = modelId.substring(0, modelId.indexOf("/jcr:content/model"));

                    if(paths.indexOf(modelId) != -1){
                        return;
                    }

                    store.remove(rec);
                })
            }

            this.store.on('load', handler);
        }
    }
}(jQuery));