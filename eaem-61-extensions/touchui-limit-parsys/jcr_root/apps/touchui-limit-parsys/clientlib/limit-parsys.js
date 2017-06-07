// for touchui design mode
(function(){
    var pathName = window.location.pathname,
        EAEM_COMPONENT_LIMIT = "eaemComponentLimit";

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
            var limitField = new CQ.Ext.form.TextField({
                value: data[EAEM_COMPONENT_LIMIT] || "",
                fieldLabel: "Limit Components to ",
                name: "./" + EAEM_COMPONENT_LIMIT,
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

    var EAEM_COMPONENT_LIMIT = "eaemComponentLimit";

    $(extendComponentDrop);

    function getDesignPath(editable){
        var parsys = editable.getParent(),
            designSrc = parsys.config.designDialogSrc,
            result = {}, param;

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

        //handle drop action
        compDragDrop.handleDrop = function(dropFn){
            return function (event) {
                if(showError(event.currentDropTarget.targetEditable)){
                    return;
                }

                return dropFn.call(this, event);
            };
        }(compDragDrop.handleDrop);

        //handle insert action
        gAuthor.edit.actions.openInsertDialog = function(openDlgFn){
            return function (editable) {
                if(showError(editable)){
                    return;
                }

                return openDlgFn.call(this, editable);
            }
        }(gAuthor.edit.actions.openInsertDialog);

        //handle paste action
        var insertAction = gAuthor.edit.Toolbar.defaultActions["INSERT"];

        insertAction.handler = function(insertHandlerFn){
            return function(editableBefore, param, target){
                if(showError(editableBefore)){
                    return;
                }

                return insertHandlerFn.call(this, editableBefore, param, target)
            }
        }(insertAction.handler);

        function showError(editable){
            var limit = isWithinLimit(editable);

            if(!limit.isWithin){
                showErrorAlert("Limit exceeded, allowed - " + limit.currentLimit);
                return true;
            }

            return false;
        }
    }

    function getChildEditables(parsys){
        var editables = gAuthor.edit.findEditables(),
            children = [], parent;

        _.each(editables, function(editable){
            parent = editable.getParent();

            if(parent && (parent.path === parsys.path)){
                children.push(editable);
            }
        });

        return children;
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

    function isWithinLimit(editable){
        var path = getDesignPath(editable),
            children = getChildEditables(editable.getParent()),
            isWithin = true, currentLimit = "";

        $.ajax( { url: path + ".2.json", async: false } ).done(function(data){
            if(_.isEmpty(data) || !data[EAEM_COMPONENT_LIMIT]){
                return;
            }

            currentLimit = data[EAEM_COMPONENT_LIMIT];

            var limit = parseInt(data[EAEM_COMPONENT_LIMIT]);

            isWithin = children.length <= limit;
        });

        return {
            isWithin: isWithin,
            currentLimit: currentLimit
        };
    }
})($(document), Granite.author);
