(function(){
    var PARSYS_DESIGN_DIALOG = "/libs/foundation/components/parsys/design_dialog",
        PARSYS_PLACEHOLDER_TEXT = "parsysPlaceholderText",
        PARSYS_TEXT_COLOR = "parsysTextColor",
        PARSYS_BG_COLOR = "parsysBackgroundColor",
        PARSYS_BORDER_COLOR = "parsysBorderColor",
        designExtended = false;

    CQ.Ext.onReady(function () {
        if(CQ.WCM.isEditMode()){
            handleEditMode();
        }

        if(CQ.WCM.isDesignMode()){
            handleDesignMode();
        }
    });

    function handleDesignMode(){
        if( designExtended === true ){
            return;
        }

        extendShowDialog();
    }

    function handleEditMode(){
        CQ.WCM.on("editablesready", configureParsys, this);
    }

    function isParsysNew(editable){
        return _.isObject(editable.params)
            && (editable.params["./sling:resourceType"] == CQ.wcm.EditBase.PARSYS_NEW);
    }

    function configureParsys(){
        var parsyses = getParsyses(), placeholder,
            $placeholder, $pContainer, designConfig;

        _.each(parsyses, function(parsys){
            if(!parsys.emptyComponent) {
                return;
            }

            designConfig = getConfiguration(parsys);

            placeholder = parsys.emptyComponent.findByType("static")[0];

            $placeholder = $(placeholder.el.dom);

            $pContainer = $placeholder.closest(".cq-editrollover-insert-container");

            if(designConfig[PARSYS_PLACEHOLDER_TEXT]){
                $placeholder.html(designConfig[PARSYS_PLACEHOLDER_TEXT]);
            }

            if(designConfig[PARSYS_TEXT_COLOR]){
                $placeholder.css("color", getColor(designConfig[PARSYS_TEXT_COLOR]));
            }

            if(designConfig[PARSYS_BG_COLOR]){
                $pContainer.css("background-color", getColor(designConfig[PARSYS_BG_COLOR]));
            }

            if(designConfig[PARSYS_BORDER_COLOR]){
                var color = getColor(designConfig[PARSYS_BORDER_COLOR]);

                parsys.highlight.on("beforeshow", function(highlight){
                    $("#" + highlight.id).css("background-color", color);
                })
            }
        });
    }

    function getColor(color){
        color = color.trim();

        if(color.indexOf("#") !== 0){
            color = "#" + color;
        }

        return color;
    }

    function getConfiguration(editComponent) {
        var pageInfo = CQ.utils.WCM.getPageInfo(editComponent.path),
            designConfig = {}, cellSearchPath, parentPath, parName;

        if (!pageInfo || !pageInfo.designObject) {
            return;
        }

        try {
            cellSearchPath = editComponent.cellSearchPath;
            parentPath = editComponent.getParent().path;

            cellSearchPath = cellSearchPath.substring(0, cellSearchPath.indexOf("|"));
            parName = parentPath.substring(parentPath.lastIndexOf("/") + 1);

            designConfig = pageInfo.designObject.content[cellSearchPath][parName];
        } catch (err) {
            console.log("Error getting parsys configuration", err);
        }

        return designConfig;
    }

    function getParsyses(){
        var parsyses = {};

        _.each(CQ.WCM.getEditables(), function(e){
            if(!isParsysNew(e)){
                return;
            }

            parsyses[e.path] = e;
        });

        return parsyses;
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

            var parsysPlaceholderText = new CQ.Ext.form.TextField({
                value: data[PARSYS_PLACEHOLDER_TEXT] || "",
                fieldLabel: "Parsys Text",
                name: "./" + PARSYS_PLACEHOLDER_TEXT,
                style: {
                    marginBottom: '10px'
                }
            });

            var colorConfig = {
                showHexValue: true,
                editable: true,
                style: {
                    marginBottom: '10px'
                }
            };

            var parsysTextColor = new CQ.form.ColorField(_.extend({
                fieldLabel: "Parsys Text Color",
                name: "./" + PARSYS_TEXT_COLOR
            }, colorConfig));

            var parsysBackgroundColor = new CQ.form.ColorField(_.extend({
                fieldLabel: "Parsys Background Color",
                name: "./" + PARSYS_BG_COLOR
            }, colorConfig));

            var parsysBorderColor = new CQ.form.ColorField(_.extend({
                fieldLabel: "Parsys Border Color",
                name: "./" + PARSYS_BORDER_COLOR
            }, colorConfig));

            var compSelector = dialog.findByType("componentselector")[0],
                ownerCt = compSelector.ownerCt;

            ownerCt.insert(2, parsysBorderColor);
            ownerCt.insert(2, parsysBackgroundColor);
            ownerCt.insert(2, parsysTextColor);
            ownerCt.insert(2, parsysPlaceholderText);

            ownerCt.doLayout();

            parsysTextColor.setValue(data[PARSYS_TEXT_COLOR] || "");
            parsysBackgroundColor.setValue(data[PARSYS_BG_COLOR] || "");
            parsysBorderColor.setValue(data[PARSYS_BORDER_COLOR] || "");
        }
    }
}());