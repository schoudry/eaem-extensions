(function ($, $document) {
    var EAEM_PLUGIN_ID = "eaemfont",
        EAEM_TEXT_FONT_FEATURE = "eaemTextFont",
        EAEM_TEXT_FONT_ICON = EAEM_PLUGIN_ID + "#" + EAEM_TEXT_FONT_FEATURE,
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        FONT_SELECTOR_URL = "/apps/eaem-touchui-cfm-font-size-plugin/font-selector.html",
        SENDER = "experience-aem", REQUESTER = "requester", $eaemFontPicker,
        url = document.location.pathname;

    if( url.indexOf("/editor.html") == 0 ){
        extendStyledTextEditor();

        registerPlugin();
    }else if(url.indexOf(FONT_SELECTOR_URL) == 0){
        handlePicker();
    }

    function handlePicker(){
        fillDefaultValues();

        $document.on("click", CANCEL_CSS, sendCancelMessage);

        $document.submit(sentTextAttributes);
    }

    function fillDefaultValues(){
        $document.on("foundation-contentloaded", handler);

        function handler(){
            var queryParams = queryParameters(),
                $form = $("form");

            if(!_.isEmpty(queryParams.color)){
                $form.find("[name='./color']").val(decodeURIComponent(queryParams.color));
            }

            if(!_.isEmpty(queryParams.size)){
                $form.find("[name='./size']").val(queryParams.size);
            }
        }
    }

    function sentTextAttributes(){
        var message = {
            sender: SENDER,
            action: "submit",
            data: {}
        }, $form = $("form"), $field;

        _.each($form.find("[name^='./']"), function(field){
            $field = $(field);
            message.data[$field.attr("name").substr(2)] = $field.val();
        });

        parent.postMessage(JSON.stringify(message), "*");
    }

    function queryParameters() {
        var result = {}, param,
            params = document.location.search.split(/\?|\&/);

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }

    function sendCancelMessage(){
        var message = {
            sender: SENDER,
            action: "cancel"
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    function closePicker(event){
        event = event.originalEvent || {};

        if (_.isEmpty(event.data)) {
            return;
        }

        var message, action;

        try{
            message = JSON.parse(event.data);
        }catch(err){
            return;
        }

        if (!message || message.sender !== SENDER) {
            return;
        }

        action = message.action;

        if(action === "submit"){
            $eaemFontPicker.eaemFontPlugin.editorKernel.execCmd(EAEM_TEXT_FONT_FEATURE, message.data);
        }

        var modal = $eaemFontPicker.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    function extendStyledTextEditor(){
        var origFn = Dam.CFM.StyledTextEditor.prototype._start;

        Dam.CFM.StyledTextEditor.prototype._start = function(){
            addTextFontPluginSettings(this);
            origFn.call(this);
        }
    }

    function addTextFontPluginSettings(editor){
        var config = editor.$editable.data("config");

        config.rtePlugins[EAEM_PLUGIN_ID] = {
            features: "*"
        };

        config.uiSettings.cui.multieditorFullscreen.toolbar.push(EAEM_TEXT_FONT_ICON);
    }

    function registerPlugin(){
        var EAEM_CFM_TEXT_FONT_PLUGIN = new Class({
            toString: "eaemCFMTextFontPlugin",

            extend: CUI.rte.plugins.Plugin,

            textFontUI:  null,

            getFeatures: function () {
                return [ EAEM_TEXT_FONT_FEATURE ];
            },

            notifyPluginConfig: function (pluginConfig) {
                var defaults = {
                    tooltips: {}
                };

                defaults.tooltips[EAEM_TEXT_FONT_FEATURE] = {
                    title: "Set text font size, color..."
                };

                CUI.rte.Utils.applyDefaults(pluginConfig, defaults);

                this.config = pluginConfig;
            },

            initializeUI: function (tbGenerator) {
                if (!this.isFeatureEnabled(EAEM_TEXT_FONT_FEATURE)) {
                    return;
                }

                this.textFontUI = new tbGenerator.createElement(EAEM_TEXT_FONT_FEATURE, this,
                    false, this.config.tooltips[EAEM_TEXT_FONT_FEATURE]);

                tbGenerator.addElement(EAEM_TEXT_FONT_FEATURE, 999, this.textFontUI, 999);

                if (tbGenerator.registerIcon) {
                    tbGenerator.registerIcon(EAEM_TEXT_FONT_ICON, "textColor");
                }

                $(window).off('message', closePicker).on('message', closePicker);
            },

            isValidSelection: function(){
                var winSel = window.getSelection();
                return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
            },

            execute: function (pluginCommand, value, envOptions) {
                var context = envOptions.editContext;

                if (pluginCommand != EAEM_TEXT_FONT_FEATURE) {
                    return;
                }

                if(!this.isValidSelection()){
                    return;
                }

                var selection = CUI.rte.Selection.createProcessingSelection(context),
                    ek = this.editorKernel,
                    startNode = selection.startNode;

                if ( (selection.startOffset === startNode.length) && (startNode != selection.endNode)) {
                    startNode = startNode.nextSibling;
                }

                var tag = CUI.rte.Common.getTagInPath(context, startNode, "span"),
                    color = $(tag).css("color"), size = $(tag).css("font-size");

                this.showFontModal(this.getPickerIFrameUrl(size, color));
            },

            showFontModal: function(url){
                var self = this, $iframe = $('<iframe>'),
                    $modal = $('<div>').addClass('eaem-cfm-font-size coral-Modal');

                $iframe.attr('src', url).appendTo($modal);

                $modal.appendTo('body').modal({
                    type: 'default',
                    buttons: [],
                    visible: true
                });

                $eaemFontPicker = $modal;

                $eaemFontPicker.eaemFontPlugin = self;

                $modal.nextAll(".coral-Modal-backdrop").addClass("cfm-coral2-backdrop");
            },

            getPickerIFrameUrl: function(size, color){
                var url = Granite.HTTP.externalize(FONT_SELECTOR_URL) + "?" + REQUESTER + "=" + SENDER;

                if(!_.isEmpty(color)){
                    if(color.indexOf("rgb") == 0){
                        color = encodeURIComponent(CUI.util.color.RGBAToHex(color));
                    }

                    url = url + "&color=" + color;
                }

                if(!_.isEmpty(size)){
                    url = url + "&size=" + size;
                }

                return url;
            }
        });

        var EAEM_CFM_TEXT_FONT_CMD = new Class({
            toString: "eaemCFMTextFontCmd",

            extend: CUI.rte.commands.Command,

            isCommand: function (cmdStr) {
                return (cmdStr.toLowerCase() == EAEM_TEXT_FONT_FEATURE);
            },

            getProcessingOptions: function () {
                var cmd = CUI.rte.commands.Command;
                return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
            },

            getTagObject: function(size, color) {
                var style = "";

                if(!_.isEmpty(color)){
                    style = "color: " + color + ";";
                }

                if(!_.isEmpty(size)){
                    style = style + "font-size: " + size;
                }

                return {
                    "tag": "span",
                    "attributes": {
                        "style" : style
                    }
                };
            },

            execute: function (execDef) {
                var textData = execDef.value, selection = execDef.selection,
                    nodeList = execDef.nodeList;

                if (!selection || !nodeList) {
                    return;
                }

                var common = CUI.rte.Common,
                    context = execDef.editContext,
                    tagObj = this.getTagObject(textData.size, textData.color);

                if(_.isEmpty(textData)){
                    nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, undefined, true);
                    return;
                }

                var tags = common.getTagInPath(context, selection.startNode, tagObj.tag);

                //remove existing color before adding new color
                if (tags != null) {
                    nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, undefined, true);
                }

                nodeList.surround(execDef.editContext, tagObj.tag, tagObj.attributes);
            },

            queryState: function(selectionDef, cmd) {
                return false;
            }
        });

        CUI.rte.plugins.PluginRegistry.register(EAEM_PLUGIN_ID, EAEM_CFM_TEXT_FONT_PLUGIN);

        CUI.rte.commands.CommandRegistry.register(EAEM_TEXT_FONT_FEATURE, EAEM_CFM_TEXT_FONT_CMD);
    }
}(jQuery, jQuery(document)));