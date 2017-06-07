(function(){
    var pathName = window.location.pathname;

    if( pathName.indexOf("/libs/cq/taskmanagement/content/taskmanager.htm") != 0 ){
        return;
    }

    var TREE_ID = "cq-taskmanager-tree";

    function sort(treePanel, asc){
        treePanel.on('load', function(node){
            node.childNodes.sort(function(a,b){
                a = a["text"].toLowerCase();
                b = b["text"].toLowerCase();
                return asc ? ( a > b ? 1 : (a < b ? -1 : 0) ) : ( a > b ? -1 : (a < b ? 1 : 0) ) ;
            });
        })
    }

    var INTERVAL = setInterval(function(){
        var tree = CQ.Ext.getCmp(TREE_ID);

        if(tree){
            clearInterval(INTERVAL);
            sort(tree, true);
        }
    }, 250);
}());