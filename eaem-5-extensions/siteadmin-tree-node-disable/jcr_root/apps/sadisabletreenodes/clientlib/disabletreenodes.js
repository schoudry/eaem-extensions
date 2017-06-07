CQ.Ext.ns("MyClientLib");

MyClientLib.SiteAdmin = {
    SA_TREE: "cq-siteadmin-tree",

    disableGeometrixx: function(tree){
        if(!tree){
            return;
        }

        var node = tree.getRootNode();

        node.on('expand',function(){
            CQ.Ext.each(this.childNodes, function(cNode){
                var disable = cNode.attributes["name"].indexOf("geometrixx") == 0;

                if(disable === true){
                    cNode.setCls("x-item-disabled");
                    var disableFn = function(){
                        return false;
                    };
                    cNode.on('beforeclick', disableFn);
                    cNode.on('beforedblclick', disableFn);
                    cNode.on('beforeexpand', disableFn);
                    cNode.on('beforecollapse', disableFn);
                    cNode.on('beforeinsert', disableFn);
                    cNode.on('beforemove', disableFn);
                    cNode.on('beforeremove', disableFn);
                }
            });
        });

        //collapse and expand to fire the expand event,
        node.collapse();
        node.expand();
    }
};

(function(){
    if(window.location.pathname == "/siteadmin"){
        var INTERVAL = setInterval(function(){
            var s = MyClientLib.SiteAdmin;
            var tree = CQ.Ext.getCmp(s.SA_TREE);

            if(tree){
                clearInterval(INTERVAL);
                s.disableGeometrixx(tree);
            }
        }, 250);
    }
})();