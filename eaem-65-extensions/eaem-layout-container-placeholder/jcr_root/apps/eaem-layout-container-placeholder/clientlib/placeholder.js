(function ($, $document) {
    var BG_COLOR = "#C7B097",
        PLACEHOLDER_TEXT = "Experience AEM - Drag components here",
        LAYOUT_CONTAINER_NEW = "wcm/foundation/components/responsivegrid/new";

    $document.on("cq-editable-added", function(event){
        modifyLayoutContainer([event.editable]);
    });

    $document.on('cq-layer-activated', function(){
        modifyLayoutContainer(Granite.author.editables);
    });

    function modifyLayoutContainer(editables){
        _.each(editables, function(editable){
            if(!editable || !(editable.type == LAYOUT_CONTAINER_NEW)){
                return;
            }

            if(!editable.overlay || !editable.overlay.dom){
                editable.dom.css("background-color", BG_COLOR).attr("data-text", PLACEHOLDER_TEXT);
                return;
            }

            //for new layout containers, Granite.author.Inspectable.prototype.hasPlaceholder()
            //always returns "Drag components here"
            editable.overlay.dom.css("background-color", BG_COLOR).attr("data-text", PLACEHOLDER_TEXT);
        });
    }
}(jQuery, jQuery(document)));