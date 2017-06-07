(function(){
    var pathName = window.location.pathname,
        PARSYS_PLACEHOLDER_TEXT = "parsysPlaceholderText",
        PARSYS_TEXT_COLOR = "parsysTextColor",
        PARSYS_BG_COLOR = "parsysBackgroundColor",
        PARSYS_BORDER_COLOR = "parsysBorderColor",
        PARSYS_DROP_BG_COLOR = "parsysDropBackgroundColor",
        PARSYS_DROP_BORDER_COLOR = "parsysDropBorderColor";

    // for touchui design mode
    (function(){
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

                    addParsysConfiguration(win);
                });
            }, 250);
        }

        function addParsysConfiguration(win){
            var compSelector = win.findByType("componentselector");

            if(compSelector.length == 0){
                return;
            }

            compSelector = compSelector[0];

            var dialog = compSelector.findParentByType("dialog");

            $.ajax( dialog.path + ".2.json" ).done(handler);

            function handler(data){
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

                var parsysDropBackgroundColor =  new CQ.form.ColorField(_.extend({
                    fieldLabel: "Parsys Drop Background Color",
                    name: "./" + PARSYS_DROP_BG_COLOR
                }, colorConfig));

                var parsysDropBorderColor =  new CQ.form.ColorField(_.extend({
                    fieldLabel: "Parsys Drop Border Color",
                    name: "./" + PARSYS_DROP_BORDER_COLOR
                }, colorConfig));

                var ownerCt = compSelector.ownerCt;

                ownerCt.insert(2, parsysDropBorderColor);
                ownerCt.insert(2, parsysDropBackgroundColor);
                ownerCt.insert(2, parsysBorderColor);
                ownerCt.insert(2, parsysBackgroundColor);
                ownerCt.insert(2, parsysTextColor);
                ownerCt.insert(2, parsysPlaceholderText);

                ownerCt.doLayout();

                parsysTextColor.setValue(data[PARSYS_TEXT_COLOR] || "");
                parsysBackgroundColor.setValue(data[PARSYS_BG_COLOR] || "");
                parsysBorderColor.setValue(data[PARSYS_BORDER_COLOR] || "");
                parsysDropBackgroundColor.setValue(data[PARSYS_DROP_BG_COLOR] || "");
                parsysDropBorderColor.setValue(data[PARSYS_DROP_BORDER_COLOR] || "");
            }
        }
    }());

    // for touchui edit mode
    (function ($, $document, gAuthor) {
        if( pathName.endsWith("dialogwrapper.html") ){
            return;
        }

        var PARSYS = "foundation/components/parsys/new",
            IPARSYS = "foundation/components/iparsys/new",
            PARSYS_SELECTOR = "[data-path$='/*']",
            PLACE_HOLDER = "cq-Overlay--placeholder",
            configCache = {};

        $document.on('cq-layer-activated', extendParsys);

        $document.on("cq-overlay-hover.cq-edit-layer", function (event) {
            if(!event.inspectable){
                return;
            }

            configureParsys(event.inspectable, event.originalEvent.type);
        });

        function extendParsys(event){
            if(event.layer !== "Edit"){
                return;
            }

            _.each(getParsyses(), function(parsys){
                configureParsys(parsys);
            })
        }

        function configureParsys(parsys, type){
            if(!parsys || !parsys.getParent() || !parsys.getParent().overlay){
                return;
            }

            var $overlay = $(parsys.getParent().overlay.dom),
                $placeholder = $overlay.find(PARSYS_SELECTOR);

            if(!$placeholder.hasClass(PLACE_HOLDER)){
                return;
            }

            if(_.isEmpty(configCache[parsys.getParent().path])){
                $.ajax( getDesignPath(parsys) + ".2.json" ).done(configure);
            }else{
                configure(configCache[parsys.getParent().path]);
            }

            function configure(data){
                if(_.isEmpty(data)){
                    return;
                }

                configCache[parsys.getParent().path] = data;

                var color;

                if(!_.isEmpty(data[PARSYS_PLACEHOLDER_TEXT])){
                    $placeholder.attr("data-text", data[PARSYS_PLACEHOLDER_TEXT]);
                }

                if(!_.isEmpty(data[PARSYS_TEXT_COLOR])){
                    $placeholder.css("color", getColor(data[PARSYS_TEXT_COLOR]));
                }

                if(!_.isEmpty(data[PARSYS_BG_COLOR])){
                    $placeholder.css("background-color", getColor(data[PARSYS_BG_COLOR]));
                }

                if(!_.isEmpty(data[PARSYS_BORDER_COLOR])){
                    $placeholder.css("border-color", getColor(data[PARSYS_BORDER_COLOR]));
                }

                if(!_.isEmpty(data[PARSYS_DROP_BG_COLOR]) && type && (type === 'mouseover')){
                    $placeholder.css("background-color", getColor(data[PARSYS_DROP_BG_COLOR]));
                }

                if(!_.isEmpty(data[PARSYS_DROP_BORDER_COLOR]) && type && (type === 'mouseover')){
                    $placeholder.css("border-color", getColor(data[PARSYS_DROP_BORDER_COLOR]));
                }
            }

            function resetColors(){
                $placeholder.css("color" , "");
                $placeholder.css("background-color" , "");
                $overlay.css("border-color" , "");
            }
        }

        function getColor(color){
            color = color.trim();

            if(color.indexOf("#") !== 0){
                color = "#" + color;
            }

            return color;
        }

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

        function isParsys(editable){
            return editable && (editable.type === PARSYS || editable.type === IPARSYS);
        }

        function getParsyses(){
            var editables = gAuthor.edit.findEditables(),
                parsys = [];

            _.each(editables, function(editable){
                if(isParsys(editable)){
                    parsys.push(editable);
                }
            });

            return parsys;
        }
    })(jQuery, jQuery(document), Granite.author);
}());
