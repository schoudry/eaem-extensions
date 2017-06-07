(function(){
    var PREFIX = "eaem_";

    CQ.Ext.onReady(function () {
        if(!CQ.WCM.isEditMode()){
            return;
        }

        CQ.WCM.on("editablesready", iterateEditables, this);
    });

    function iterateEditables(){
        var editables = CQ.utils.WCM.getEditables();

        _.each(editables, function (editable) {
            extendCreateParagraph(editable);
        });
    }

    function extendCreateParagraph(editable){
        if(!editable.createParagraph){
            return;
        }

        var cqCreateParagraph = editable.createParagraph;

        editable.createParagraph = function extCreateParagraph(definition, extraParams, noEvent, loadAnnotations,
                                               ignoreTemplate, preventUndo, undoCfg) {
            var resType = definition.virtual ? definition.virtualResourceType : definition.resourceType;

            if (!resType || !this.isInsertAllowed(resType)) {
                return null;
            }

            extraParams = extraParams || {};

            extraParams[":nameHint"] = getNameHint(resType);

            cqCreateParagraph.call(this, definition, extraParams, noEvent, loadAnnotations,
                                        ignoreTemplate, preventUndo, undoCfg);
        }
    }

    function getNameHint(resType){
        return (PREFIX + resType.substring(resType.lastIndexOf('/') + 1));

        //var nameHint = PREFIX + resType.substring(resType.lastIndexOf('/') + 1);
        //return _.camelCase(nameHint); AEM includes lodash 2.4.1, camelCase is available in 3.0.0
    }
})();