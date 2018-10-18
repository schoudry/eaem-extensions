(function ($, $document, gAuthor) {
    var CORAL_MULTIFIELD_ITEM = "coral-multifield-item",
        CORAL_MULTIFIELD_ITEM_CONTENT = "coral-multifield-item-content",
        MF_NAME_ATTR = "data-granite-coral-multifield-name",
        COMPOSITE_MF_SEL = "[data-granite-coral-multifield-composite]",
        RS_MULTIFIELD = "granite/ui/components/coral/foundation/form/multifield";

    extendRequestSave();

    function extendRequestSave(){
        var CFM  = window.Dam.CFM,
            orignFn = CFM.editor.Page.requestSave;

        CFM.editor.Page.requestSave = requestSave;

        function requestSave(callback, options) {
            orignFn.call(this, callback, options);

            var mfsData = getMultifieldData();

            if(_.isEmpty(mfsData)){
                return;
            }

            var url = CFM.EditSession.fragment.urlBase + ".cfm.content.json",
                variationName = $("aem-cfm-editor-elements-form").attr("data-variation"),
                createNewVersion = (options && !!options.newVersion) || false;

            var data = {
                ":type": "multiple",
                ":newVersion": createNewVersion,
                "_charset_": "utf-8"
            };

            if (variationName) {
                data[":variation"] = variationName;
            }

            var request = {
                url: url,
                method: "post",
                dataType: "json",
                data: _.merge(data, mfsData),
                cache: false
            };

            CFM.RequestManager.schedule({
                request: request,
                type: CFM.RequestManager.REQ_BLOCKING,
                condition: CFM.RequestManager.COND_EDITSESSION,
                ui: (options && options.ui),
                handlers: {
                    success: function (response) {
                        console.log(response);
                    }
                }
            })
        }
    }

    function getMultifieldData(){
        var $composites = $(COMPOSITE_MF_SEL), value,
            mfData = {}, values, $fields, $field;

        _.each($composites, function(mField){
            values = [];

            _.each(mField.items.getAll(), function(item) {
                $fields = $(item.content).find("[name]");

                value = {};

                _.each($fields, function(field){
                    $field = $(field);

                    value[getNameDotSlashRemoved($field.attr("name"))] =  $field.val();
                });

                values.push(JSON.stringify(value));
            });

            mfData[ ($(mField)).attr(MF_NAME_ATTR)] = values;
        });

        return mfData;
    }

    function getNameDotSlashRemoved(name){
        if(_.isEmpty(name)){
            return name;
        }

        return ((name.indexOf("./") == 0) ? name.substr(2) : name);
    }
}(jQuery, jQuery(document)));