Ext.onReady(function(){
    var INTERVAL = setInterval(function(){
        var tree = Ext.getCmp(CRX.ide.TREE_ID);

        if(!tree){
            return;
        }

        clearInterval(INTERVAL);

        var listeners = tree.initialConfig.listeners;

        tree.removeListener("beforenodedrop", listeners.beforenodedrop, tree);

        tree.on("beforenodedrop", function(dropEvent){
            /*var r = confirm("You are trying to move a node, Are you sure?");

            if (r) {
                return listeners.beforenodedrop.call(tree, dropEvent);
            } else {
                return false;
            }*/

            //uncomment this block for stopping node move, with no shift key press
            var shiftKey = dropEvent.rawEvent.browserEvent.shiftKey;

            if(!shiftKey){
                Ext.Msg.alert("Alert", "If you'd like to move a node, press shift on keyboard before dragging");
                return false;
            }

            return listeners.beforenodedrop.call(tree, dropEvent);
        });
    }, 250);
});