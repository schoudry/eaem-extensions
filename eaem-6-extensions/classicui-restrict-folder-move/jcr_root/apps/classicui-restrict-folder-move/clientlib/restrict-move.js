(function () {
    if (window.location.pathname !== "/damadmin") {
        return;
    }

    var NESTING_ALLOWED = 1, TREE = "cq-damadmin-tree";

    /*//the original move dialog fn
    var cqMoveDialog = CQ.wcm.Page.getMovePageDialog;

    //override ootb function
    CQ.wcm.Page.getMovePageDialog = function (path, isPage) {
        var dialog = cqMoveDialog(path, isPage);

        function handler(isNotAllowed) {
            if (isNotAllowed) {
                CQ.Ext.Msg.alert("Error", "Moving Folder with > " + NESTING_ALLOWED + " level subfolders, not allowed");
                dialog.close();
            }
        }

        isMoveAllowed(path).then(handler);

        return dialog;
    };*/

    //the original move dialog fn
    var cqMovePage = CQ.wcm.SiteAdmin.movePage;

    //override ootb function
    CQ.wcm.SiteAdmin.movePage = function () {
        var selections = this.getSelectedPages();

        if(selections.length == 0){
            return;
        }

        var that = this;

        function handler(isNotAllowed) {
            if (isNotAllowed) {
                CQ.Ext.Msg.alert("Error", "Moving Folder with > " + NESTING_ALLOWED + " level subfolders, not allowed");
                return;
            }

            cqMovePage.call(that);
        }

        isMoveAllowed(selections[0].id).then(handler);
    };

    var INTERVAL = setInterval(function(){
        var tree = CQ.Ext.getCmp(TREE);

        if(tree){
            clearInterval(INTERVAL);
            handleTreeNodeMove(tree);
        }
    }, 250);

    function getFolderJson(path) {
        return $.ajax( path + "." + (NESTING_ALLOWED + 1) + ".json" );
    }

    function isMoveAllowed(path) {
        function handler(data) {
            return reachedMaxNestedLevel(data, NESTING_ALLOWED);
        }

        function reachedMaxNestedLevel(folder, nestingNum) {
            for (var x in folder) {
                if (!folder.hasOwnProperty(x) || !isFolder(folder[x])) {
                    continue;
                }

                if (nestingNum == 0) {
                    return true;
                }

                if (reachedMaxNestedLevel(folder[x], nestingNum - 1)) {
                    return true;
                }
            }

            return false;
        }

        return getFolderJson(path).then(handler);
    }

    function handleTreeNodeMove(tree) {
        var listeners = tree.initialConfig.listeners;

        tree.removeListener("beforenodedrop", listeners.beforenodedrop, tree);

        tree.on("beforenodedrop", function (dropEvent) {
            CQ.Ext.Msg.alert("Error", "Moving tree nodes not allowed, use Move... in grid");
            return false;
        });
    }

    function isFolder(node) {
        return node["jcr:primaryType"] == "sling:OrderedFolder";
    }
}());