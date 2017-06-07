(function ($, $document, gAuthor) {
    var PLACEHOLDER_TEXT = "eaemPlaceholderText",
        PLACEHOLDER_BG_COLOR = "eaemPlaceholderBGColor",
        PLACE_HOLDER = "cq-Overlay--placeholder",
        configCache = {},
        //look for configured placeholders only on these components
        LOOK_FOR_PLACEHOLDER_COMPONENTS = [
            "/libs/foundation/components/text",
            "/libs/foundation/components/textimage"
        ];

    $document.on('cq-layer-activated', addPlaceholder);

    $document.on('cq-inspectable-added', componentAdded);

    function componentAdded(event){
        var LM = gAuthor.layerManager;

        if (LM.getCurrentLayer() != "Edit") {
            return;
        }

        var editable = event.inspectable;

        //placeholder overlay gets added after triggering cq-inspectable-added event
        //add a setTimeout workaround
        setTimeout(function(){
            configurePlaceholder(editable);
        }, 500)
    }

    function addPlaceholder(event){
        if(event.layer !== "Edit"){
            return;
        }

        _.each(gAuthor.edit.findEditables(), configurePlaceholder);
    }

    function prefixLib(type){
        type = type.trim();

        if(type.indexOf("/") !== 0){
            type = "/libs/" + type;
        }

        return type;
    }

    function configurePlaceholder(editable){
        if(!isAllowedForPlaceholderConfig(editable)){
            return;
        }

        var parent = editable.getParent(),
            $overlay = $(parent.overlay.dom),
            $placeholder = $overlay.find("[data-path='" + editable.path + "']");

        if(!$placeholder.hasClass(PLACE_HOLDER)){
            return;
        }

        var type = prefixLib(editable.type);

        if(_.isEmpty(configCache[type])){
            $.ajax( type + ".json" ).done(configure);
        }else{
            configure(configCache[type]);
        }

        function configure(data){
            if(_.isEmpty(data)){
                return;
            }

            configCache[type] = data;

            var color;

            if(!_.isEmpty(data[PLACEHOLDER_TEXT])){
                $placeholder.attr("data-text", data[PLACEHOLDER_TEXT]);
            }

            if(!_.isEmpty(data[PLACEHOLDER_BG_COLOR])){
                $placeholder.css("background-color", data[PLACEHOLDER_BG_COLOR]);
            }
        }
    }

    function isAllowedForPlaceholderConfig(editable){
        return editable && editable.getParent()
                    && editable.getParent().overlay
                    && (LOOK_FOR_PLACEHOLDER_COMPONENTS.indexOf(prefixLib(editable.type)) !== -1)
    }
})(jQuery, jQuery(document), Granite.author);
