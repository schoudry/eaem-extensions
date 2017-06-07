(function ($document, gAuthor) {
    var COMPONENT = "touchui-fileupload-default-image/sample-image-component",
        FILE_UPLOAD_WIDGET = "granite/ui/components/foundation/form/fileupload",
        DROP_TARGET_ENABLED_CLASS = "js-cq-droptarget--enabled",
        FILE_REF_PARAM = "fileReferenceParameter",
        PLACEHOLDER_PARAM = "placeholder";

    $document.on('cq-inspectable-added', addPlaceholder);

    $document.on('mouseup', setNewDropFlag);

    var newComponentDrop = false;

    function setNewDropFlag(event){
        var LM = gAuthor.layerManager;

        if (LM.getCurrentLayer() != "Edit") {
            return;
        }

        var DC = gAuthor.ui.dropController,
            generalIH = DC._interactionHandler.general;

        if (!generalIH._hasStarted || !$(event.target).hasClass(DROP_TARGET_ENABLED_CLASS)) {
            return;
        }

        newComponentDrop = true;
    }

    function addPlaceholder(event){
        var LM = gAuthor.layerManager;

        if ( (LM.getCurrentLayer() != "Edit") || !newComponentDrop) {
            return;
        }

        newComponentDrop = false;

        var editable = event.inspectable;

        if(editable.type !== COMPONENT){
            return;
        }

        $.ajax(editable.config.dialog + ".infinity.json").done(postPlaceholder);

        function postPlaceholder(data){
            var fileRefs = addFileRefs(data, {});

            if(_.isEmpty(fileRefs)){
                return;
            }

            $.ajax({
                type : 'POST',
                url : editable.path,
                data  : fileRefs
            }).done(function(){
                editable.refresh();
            })
        }

        function addFileRefs(data, fileRefs){
            if(_.isEmpty(data)){
                return fileRefs;
            }

            _.each(data, function(value, key){
                if(_.isObject(value)){
                    addFileRefs(value, fileRefs);
                }

                if( (key != "sling:resourceType") || (value != FILE_UPLOAD_WIDGET)){
                    return;
                }

                if(!data[FILE_REF_PARAM] || !data[PLACEHOLDER_PARAM]){
                    return;
                }

                fileRefs[data[FILE_REF_PARAM]] = data[PLACEHOLDER_PARAM];
            }, this);

            return fileRefs;
        }
    }
})($(document), Granite.author);