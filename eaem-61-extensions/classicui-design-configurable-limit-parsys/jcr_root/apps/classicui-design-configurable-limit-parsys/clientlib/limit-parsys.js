(function(){
    var PARSYS_DESIGN_DIALOG = "/libs/foundation/components/parsys/design_dialog",
        PARSYS_LIMIT = "eaemComponentLimit";

    CQ.Ext.onReady(function () {
        if(CQ.WCM.isEditMode()){
            handleEditMode();
        }

        if(CQ.WCM.isDesignMode()){
            handleDesignMode();
        }
    });

    function handleDesignMode(){
        extendShowDialog();
    }

    function handleEditMode(){
        CQ.WCM.on("editablesready", applyLimitAndExtendDrop, this);
    }

    function getSiblings(editable){
        var parent, siblings = [];

        _.each(CQ.WCM.getEditables(), function(e){
            parent = e.getParent();

            if(!parent || (parent.path !== editable.getParent().path)){
                return;
            }

            siblings.push(e);
        });

        return siblings;
    }

    function isWithinLimit(editComponent){
        var pageInfo = CQ.utils.WCM.getPageInfo(editComponent.path),
            isWithin = true, currentLimit = "",
            cellSearchPath, parentPath, parName;

        if(!pageInfo || !pageInfo.designObject){
            return;
        }

        try{
            cellSearchPath = editComponent.cellSearchPath;
            parentPath = editComponent.getParent().path;

            cellSearchPath = cellSearchPath.substring(0, cellSearchPath.indexOf("|"));
            parName = parentPath.substring(parentPath.lastIndexOf("/") + 1);
            currentLimit = pageInfo.designObject.content[cellSearchPath][parName][PARSYS_LIMIT];

            if(currentLimit){
                isWithin = getSiblings(editComponent).length <= parseInt(currentLimit);
            }
        }catch(err){
            console.log("Experience AEM - Error getting the component limit", err);
        }

        return {
            isWithin: isWithin,
            currentLimit: currentLimit
        };
    }

    function extendDrop(dropFn){
        return function(dragSource, e, data){
            var limit = isWithinLimit(this.editComponent);

            if(!limit.isWithin){
                this.editComponent.hideTarget();
                CQ.Ext.Msg.alert('Error', "Limit exceeded, allowed - " + limit.currentLimit);
                return false;
            }

            return dropFn.call(this, dragSource, e, data);
        };
    }

    function disableNewMenuItem(){
        var component = this.element.linkedEditComponent;

        if (!component || !component.menuComponent) {
            return;
        }

        var menu = component.menuComponent;

        if (menu.eaemLimitSet) {
            return;
        }

        menu.eaemLimitSet = true;

        var limit = isWithinLimit(this);

        var newItem = menu.findBy(function(comp){
            return comp.text === "New...";
        })[0];

        if(!limit.isWithin){
            newItem.setDisabled(true);
        }
    }

    function isParsysNew(editable){
        return _.isObject(editable.params)
            && (editable.params["./sling:resourceType"] == CQ.wcm.EditBase.PARSYS_NEW);
    }

    function applyLimitAndExtendDrop() {
        var editables = CQ.utils.WCM.getEditables();

        _.each(editables, function (editable) {
            if (isParsysNew(editable)) {
                editable.emptyComponent.el.on("contextmenu", disableNewMenuItem, editable);
            }

            var dropTargets = editable.getDropTargets();

            if(_.isEmpty(dropTargets)){
                return;
            }

            dropTargets[0].notifyDrop = extendDrop(dropTargets[0].notifyDrop);
        });
    }

    function extendShowDialog(){
        CQ.wcm.EditBase.showDialog = (function(showDialogFn) {
            return function(editComponent, type, ignoreIsContainer){
                if(editComponent.dialog !== PARSYS_DESIGN_DIALOG){
                    return;
                }

                var isFirstRun = !editComponent.dialogs[CQ.wcm.EditBase.EDIT];

                showDialogFn.call(this, editComponent, type, ignoreIsContainer);

                if(isFirstRun){
                    editComponent.getEditDialog().on("loadcontent", extendParsysDialog);
                }
            }
        }(CQ.wcm.EditBase.showDialog));
    }

    function extendParsysDialog(dialog){
        $.ajax( dialog.path + ".2.json" ).done(handler);

        function handler(data){
            dialog.un("loadcontent", extendParsysDialog);

            var limitField = new CQ.Ext.form.TextField({
                value: data[PARSYS_LIMIT] || "",
                fieldLabel: "Component Limit",
                name: "./" + PARSYS_LIMIT,
                style: {
                    marginBottom: '10px'
                }
            });

            var compSelector = dialog.findByType("componentselector")[0],
                ownerCt = compSelector.ownerCt;

            ownerCt.insert(2, limitField);

            ownerCt.doLayout();
        }
    }
}());