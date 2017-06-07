CQ.Ext.ns("ExperienceAEM");

//asc=true for ascending order and asc=false for descending order
ExperienceAEM.sortTags =  function(pathfield, asc){
    pathfield.browseDialog.treePanel.on('load', function(node){
        node.childNodes.sort(function(a,b){
            a = a["text"].toLowerCase();
            b = b["text"].toLowerCase();
            return asc ? ( a > b ? 1 : (a < b ? -1 : 0) ) : ( a > b ? -1 : (a < b ? 1 : 0) ) ;
        });
    })
};
