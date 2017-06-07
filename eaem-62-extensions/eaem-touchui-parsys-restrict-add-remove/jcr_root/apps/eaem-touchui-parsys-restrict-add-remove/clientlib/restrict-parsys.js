// for touchui design mode
(function(){
    var pathName = window.location.pathname,
        EAEM_PARSYS_ADD_REMOVE_GROUPS = "eaemParsysAddRemoveGroups";

    if( !pathName.endsWith("dialogwrapper.html") ){
        return;
    }

    CQ.Ext.onReady(function () {
        findDesignDialogWindow();
    });

    function findDesignDialogWindow(){
        var wMgr = CQ.Ext.WindowMgr, winId;

        var W_INTERVAL = setInterval(function () {
            wMgr.each(function (win) {
                if(!win || !win.id){
                    return;
                }

                clearInterval(W_INTERVAL);

                addLimitTextField(win);
            });
        }, 250);
    }

    function addLimitTextField(win){
        var compSelector = win.findByType("componentselector");

        if(compSelector.length == 0){
            return;
        }

        compSelector = compSelector[0];

        var dialog = compSelector.findParentByType("dialog");

        $.ajax( dialog.path + ".2.json" ).done(handler);

        function handler(data){
            var limitField = new CQ.Ext.form.TextArea({
                value: data[EAEM_PARSYS_ADD_REMOVE_GROUPS] || "",
                fieldLabel: "Comma Separated Groups for adding/deleting components",
                name: "./" + EAEM_PARSYS_ADD_REMOVE_GROUPS,
                style: {
                    marginBottom: '10px'
                }
            });

            compSelector.ownerCt.insert(2, limitField);

            compSelector.ownerCt.doLayout();
        }
    }
}());

// for touchui edit mode
(function ($document, gAuthor) {
    var pathName = window.location.pathname;

    if( pathName.endsWith("dialogwrapper.html") ){
        return;
    }

    var EAEM_PARSYS_ADD_REMOVE_GROUPS = "eaemParsysAddRemoveGroups",
        userGroups = [];

    $(extendComponentDrop);

    function getDesignPath(editable){
        var parsys = editable.getParent();

        var designSrc = parsys.config.designDialogSrc, result = {}, param;

        designSrc = designSrc.substring(designSrc.indexOf("?") + 1);

        designSrc.split(/&/).forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }
            param = it.split("=");
            result[param[0]] = param[1];
        });

        return decodeURIComponent(result["content"]);
    }

    function extendComponentDrop(){
        var dropController = gAuthor.ui.dropController,
            compDragDrop = dropController.get(gAuthor.Component.prototype.getTypeName());

        compDragDrop.handleDrop = function(dropFn){
            return function (event) {
                if(!isAllowed(event.currentDropTarget.targetEditable, "Insert")){
                    return;
                }

                return dropFn.call(this, event);
            };
        }(compDragDrop.handleDrop);

        gAuthor.edit.ToolbarActions.INSERT.handler = function eaemOpenInsertDialog(executeDlgFn){
            return function (editable) {
                if(!isAllowed(editable, "Insert")){
                    return;
                }

                return executeDlgFn.call(this, editable);
            }
        }(gAuthor.edit.ToolbarActions.INSERT.handler);

        gAuthor.edit.ToolbarActions.DELETE.handler = function eaemDeleteConfirm(executeDlgFn){
            return function (editable, historyConfig) {
                if(!isAllowed(editable, "Delete")){
                    return;
                }

                return executeDlgFn.call(this, editable, historyConfig);
            }
        }(gAuthor.edit.ToolbarActions.DELETE.handler);

        function isAllowed(editable, action){
            if(_.isEmpty(userGroups)){
                userGroups = getUserGroups();
            }

            var allowed = isUserGroupAllowed(editable, userGroups);

            if(!allowed){
                showErrorAlert(action + " not allowed for user : " + gAuthor.ContentFrame.getUserID());
            }

            return allowed;
        }
    }

    function isUserGroupAllowed(editable, userGroups){
        var path = getDesignPath(editable), isAllowed = false;

        $.ajax( { url: path + ".2.json", async: false } ).done(function(data){
            if(_.isEmpty(data) || !data[EAEM_PARSYS_ADD_REMOVE_GROUPS]){
                isAllowed = true;
                return;
            }

            var groups = data[EAEM_PARSYS_ADD_REMOVE_GROUPS];

            if(_.isEmpty(groups)){
                isAllowed = true;
                return;
            }

            groups = groups.split(",");

            for(var x = 0; x < groups.length; x++ ){
                if(userGroups.indexOf(groups[x]) < 0){
                    continue;
                }

                isAllowed = true;

                break;
            }
        });

        return isAllowed;
    }

    function getUserGroups(){
        var userID = Granite.author.ContentFrame.getUserID();

        $.ajax( {
            url: "/bin/security/authorizables.json?filter=" + userID,
            async: false
        } ).done(handler);

        function handler(data){
            if(!data || !data.authorizables){
                return;
            }

            _.each(data.authorizables, function(authObj){
                if( (authObj.id !== userID) || _.isEmpty(authObj.memberOf)){
                    return;
                }

                userGroups = _.pluck(authObj.memberOf, "id");
            });
        }

        return userGroups;
    }

    function showErrorAlert(message, title){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                text: "OK",
                warning: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "error", options);
    }
})($(document), Granite.author);
