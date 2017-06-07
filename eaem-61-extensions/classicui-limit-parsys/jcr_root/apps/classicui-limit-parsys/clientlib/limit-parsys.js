(function(){
    var pathName = window.location.pathname;

    if( ( pathName !== "/cf" ) && ( pathName.indexOf("/content") !== 0)){
        return;
    }

    var EAEM_COMPONENT_LIMIT = "eaemComponentLimit";

    CQ.Ext.onReady(function() {
        CQ.WCM.on("editablesready", applyLimitAndExtendDrop, this);
    });

    function isParsysNew(editable){
        return _.isObject(editable.params)
                    && (editable.params["./sling:resourceType"] == CQ.wcm.EditBase.PARSYS_NEW);
    }

    function addMenuItem(){
        var component = this.element.linkedEditComponent;

        if (!component || !component.menuComponent) {
            return;
        }

        var menu = component.menuComponent;

        if (menu.eaemLimitSet) {
            return;
        }

        menu.eaemLimitSet = true;

        var path = this.getParentPath(),
            limit = isWithinLimit(path);

        var newItem = menu.findBy(function(comp){
            return comp.text === "New...";
        })[0];

        if(!limit.isWithin){
            newItem.setDisabled(true);
        }

        //for simplicity lets assume only "admin" has set limit access
        if(CQ.User.getCurrentUser().getUserID() === "admin"){
            menu.addSeparator();

            menu.add({
                text: "Set Component Limit",
                handler: function () {
                    var dialog = getSetLimitDialog(path, limit.currentLimit);
                    dialog.show();
                }
            });
        }
    }

    function extendDrop(dropFn){
        return function(dragSource, e, data){
            var limit = isWithinLimit(this.editComponent.getParentPath());

            if(!limit.isWithin){
                this.editComponent.hideTarget();
                CQ.Ext.Msg.alert('Error', 'More than ' + limit.currentLimit + ' components not allowed');
                return false;
            }

            return dropFn.call(this, dragSource, e, data);
        }
    }

    function applyLimitAndExtendDrop() {
        var editables = CQ.utils.WCM.getEditables();

        _.each(editables, function (editable) {
            if (isParsysNew(editable)) {
                editable.emptyComponent.el.on("contextmenu", addMenuItem, editable);
            }

            var dropTargets = editable.getDropTargets();

            if(_.isEmpty(dropTargets)){
                return;
            }

            dropTargets[0].notifyDrop = extendDrop(dropTargets[0].notifyDrop);
        });
    }

    function isWithinLimit(path){
        var isWithin = true, currentLimit = "";

        $.ajax( { url: path + ".2.json", async: false } ).done(function(data){
            if(_.isEmpty(data) || !data[EAEM_COMPONENT_LIMIT]){
                return;
            }

            currentLimit = data[EAEM_COMPONENT_LIMIT];

            var compObjects = [], limit = parseInt(data[EAEM_COMPONENT_LIMIT]);

            _.each(data, function(value, key){
                if(!_.isObject(value)){
                    return;
                }

                if(!value["sling:resourceType"]){
                    return;
                }

                compObjects.push(value);
            });

            isWithin = compObjects.length < limit;
        });

        return {
            isWithin: isWithin,
            currentLimit: currentLimit
        };
    }

    function getSetLimitDialog(path, currentLimit){
        var dialogConfig = {
            "jcr:primaryType": "cq:Dialog",
            title: "Components Limit",
            modal: true,
            width: 400,
            height: 150,
            items: [{
                xtype: "panel",
                layout: "form",
                bodyStyle :"padding: 20px",
                items: [{
                    value: currentLimit,
                    xtype: "textfield",
                    fieldLabel: "Limit to "
                }]
            }],
            ok: function () {
                var limitField = this.findByType("textfield")[0],
                    data = {};

                data[EAEM_COMPONENT_LIMIT] = limitField.getValue();

                $.ajax({
                    url: path,
                    data: data,
                    type: 'POST'
                });

                this.close();
            }
        };

        return CQ.WCM.getDialog(dialogConfig);
    }
})();