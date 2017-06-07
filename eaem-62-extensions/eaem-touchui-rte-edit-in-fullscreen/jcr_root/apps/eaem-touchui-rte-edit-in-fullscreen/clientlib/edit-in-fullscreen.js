(function ($, $document, gAuthor) {
    if(!gAuthor){
        return;
    }

    $document.on("cq-editables-loaded", function(event){
        $.each(event.editables, function(index, editable){
            if(!editable.dom || !isInPlaceEditingEnabled(editable)){
                return;
            }

            editable.dom.on("editing-start", getEditStartedListener());
        });
    });

    $document.on("inline-edit-finish", function (event) {
        event.editable.dom.on("editing-start", getEditStartedListener());
    });

    function isInPlaceEditingEnabled(editable){
        try{
            var editConfig = editable.config.editConfig;
            return editConfig && editConfig.inplaceEditingConfig && editConfig.inplaceEditingConfig.active;
        }catch(err){
            return false;
        }
    }

    function getEditStartedListener(){
        var gRegistry = Granite.author.editor.registry,
            emptyFn = function(){};

        if(_.isEmpty(gRegistry)){
            console.log("EAEM - Granite author registry not available");
            return emptyFn;
        }

        var inlineTextEditor = gRegistry["text"];

        if(!inlineTextEditor){
            console.log("EAEM - Granite author rte not available");
            return emptyFn;
        }

        return function eaemEditStartedListener(){
            if(!inlineTextEditor.rte){
                return;
            }

            inlineTextEditor.rte.editorKernel.execCmd("fullscreen-start");
        }
    }
}(jQuery, jQuery(document), Granite.author));