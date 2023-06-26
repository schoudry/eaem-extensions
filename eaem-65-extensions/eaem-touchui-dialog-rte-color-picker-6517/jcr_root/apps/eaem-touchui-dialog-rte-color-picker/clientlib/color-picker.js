(function($, CUI){
    var GROUP = "experience-aem",
        COLOR_PICKER_FEATURE = "colorPicker",
        TCP_DIALOG = "eaemTouchUIColorPickerDialog",
        PICKER_NAME_IN_POPOVER = "color",
        REQUESTER = "requester",
        PICKER_URL = "/apps/eaem-touchui-dialog-rte-color-picker/color-picker-popover/cq:dialog.html",
        url = document.location.pathname;

    if( url.indexOf(PICKER_URL) !== 0 ){
        addPluginToDefaultUISettings();
        addDialogTemplate();
    }

    var EAEMColorPickerDialog = new Class({
        extend: CUI.rte.ui.cui.AbstractDialog,

        toString: "EAEMColorPickerDialog",

        initialize: function(config) {
            this.exec = config.execute;
        },

        getDataType: function() {
            return TCP_DIALOG;
        }
    });

    var TouchUIColorPickerPlugin = new Class({
        toString: "TouchUIColorPickerPlugin",

        extend: CUI.rte.plugins.Plugin,

        pickerUI: null,

        getFeatures: function() {
            return [ COLOR_PICKER_FEATURE ];
        },

        initializeUI: function(tbGenerator) {
            var plg = CUI.rte.plugins;

            if (!this.isFeatureEnabled(COLOR_PICKER_FEATURE)) {
                return;
            }

            this.pickerUI = tbGenerator.createElement(COLOR_PICKER_FEATURE, this, false, { title: "Color Picker" });
            tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 10);

            var groupFeature = GROUP + "#" + COLOR_PICKER_FEATURE;
            tbGenerator.registerIcon(groupFeature, "textColor");
        },

        execute: function (id, value, envOptions) {
            if(!isValidSelection()){
                return;
            }

            var context = envOptions.editContext,
                selection = CUI.rte.Selection.createProcessingSelection(context),
                ek = this.editorKernel,
                startNode = selection.startNode;

            if ( (selection.startOffset === startNode.length) && (startNode != selection.endNode)) {
                startNode = startNode.nextSibling;
            }

            var tag = CUI.rte.Common.getTagInPath(context, startNode, "span"), plugin = this, dialog,
                color = $(tag).css("color"),
                dm = ek.getDialogManager(),
                $container = CUI.rte.UIUtils.getUIContainer($(context.root)),
                propConfig = {
                    'parameters': {
                        'command': this.pluginId + '#' + COLOR_PICKER_FEATURE
                    }
                };

            if(this.eaemColorPickerDialog){
                dialog = this.eaemColorPickerDialog;
            }else{
                dialog = new EAEMColorPickerDialog();

                dialog.attach(propConfig, $container, this.editorKernel);

                dialog.$dialog.css("-webkit-transform", "scale(0.9)").css("-webkit-transform-origin", "0 0")
                    .css("-moz-transform", "scale(0.9)").css("-moz-transform-origin", "0px 0px");

                dialog.$dialog.find("iframe").attr("src", getPickerIFrameUrl(color));

                this.eaemColorPickerDialog = dialog;
            }

            dm.show(dialog);

            registerReceiveDataListener(receiveMessage);

            function isValidSelection(){
                var winSel = window.getSelection();
                return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
            }

            function getPickerIFrameUrl(color){
                var url = PICKER_URL + "?" + REQUESTER + "=" + GROUP;

                if(!_.isEmpty(color)){
                    url = url + "&" + PICKER_NAME_IN_POPOVER + "=" + color;
                }

                return url;
            }

            function removeReceiveDataListener(handler) {
                if (window.removeEventListener) {
                    window.removeEventListener("message", handler);
                } else if (window.detachEvent) {
                    window.detachEvent("onmessage", handler);
                }
            }

            function registerReceiveDataListener(handler) {
                if (window.addEventListener) {
                    window.addEventListener("message", handler, false);
                } else if (window.attachEvent) {
                    window.attachEvent("onmessage", handler);
                }
            }

            function receiveMessage(event) {
                if (_.isEmpty(event.data)) {
                    return;
                }

                var message = JSON.parse(event.data),
                    action;

                if (!message || message.sender !== GROUP) {
                    return;
                }

                action = message.action;

                if (action === "submit") {
                    if (!_.isEmpty(message.data)) {
                        ek.relayCmd(id, message.data);
                    }
                }else if(action === "remove"){
                    ek.relayCmd(id);
                    plugin.eaemColorPickerDialog = null;
                }else if(action === "cancel"){
                    plugin.eaemColorPickerDialog = null;
                }

                dialog.hide();

                removeReceiveDataListener(receiveMessage);
            }
        },

        //to mark the icon selected/deselected
        updateState: function(selDef) {
            var hasUC = this.editorKernel.queryState(COLOR_PICKER_FEATURE, selDef);

            if (this.pickerUI != null) {
                this.pickerUI.setSelected(hasUC);
            }
        }
    });

    CUI.rte.plugins.PluginRegistry.register(GROUP,TouchUIColorPickerPlugin);

    var TouchUIColorPickerCmd = new Class({
        toString: "TouchUIColorPickerCmd",

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr) {
            return (cmdStr.toLowerCase() == COLOR_PICKER_FEATURE);
        },

        getProcessingOptions: function() {
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
        },

        _getTagObject: function(color) {
            return {
                "tag": "span",
                "attributes": {
                    "style" : "color: " + color
                }
            };
        },

        execute: function (execDef) {
            var color = execDef.value ? execDef.value[PICKER_NAME_IN_POPOVER] : undefined,
                selection = execDef.selection,
                nodeList = execDef.nodeList;

            if (!selection || !nodeList) {
                return;
            }

            var common = CUI.rte.Common,
                context = execDef.editContext,
                tagObj = this._getTagObject(color);

            //if no color value passed, assume delete and remove color
            if(_.isEmpty(color)){
                nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, undefined, true);
                return;
            }

            var tags = common.getTagInPath(context, selection.startNode, tagObj.tag);

            //remove existing color before adding new color
            if (tags != null) {
                nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, undefined, true);
                nodeList.commonAncestor = nodeList.nodes[0].dom.parentNode;
            }

            nodeList.surround(execDef.editContext, tagObj.tag, tagObj.attributes);
        }
    });

    CUI.rte.commands.CommandRegistry.register(COLOR_PICKER_FEATURE, TouchUIColorPickerCmd);

    function addPluginToDefaultUISettings(){
        var toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.inline.toolbar;
        toolbar.splice(3, 0, GROUP + "#" + COLOR_PICKER_FEATURE);

        toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.fullscreen.toolbar;
        toolbar.splice(3, 0, GROUP + "#" + COLOR_PICKER_FEATURE);
    }

    function addDialogTemplate(){
        var url = PICKER_URL + "?" + REQUESTER + "=" + GROUP;

        var html = "<iframe width='600px' height='500px' frameBorder='0' src='" + url + "'></iframe>";

        if(_.isUndefined(CUI.rte.Templates)){
            CUI.rte.Templates = {};
        }

        if(_.isUndefined(CUI.rte.templates)){
            CUI.rte.templates = {};
        }

        CUI.rte.templates['dlg-' + TCP_DIALOG] = CUI.rte.Templates['dlg-' + TCP_DIALOG] = Handlebars.compile(html);
    }
}(jQuery, window.CUI,jQuery(document)));

(function($, $document){
    var SENDER = "experience-aem",
        REQUESTER = "requester",
        COLOR = "color",
        ADD_COLOR_BUT = "#EAEM_CP_ADD_COLOR",
        REMOVE_COLOR_BUT = "#EAEM_CP_REMOVE_COLOR";

    if(queryParameters()[REQUESTER] !== SENDER ){
        return;
    }

    $(function(){
        _.defer(stylePopoverIframe);
    });

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

    function stylePopoverIframe(){
        var queryParams = queryParameters(),
            $dialog = $("coral-dialog");

        if(_.isEmpty($dialog)){
            return;
        }

        $dialog.css("overflow", "hidden").css("background-color", "#fff");

        $dialog[0].open = true;

        var $addColor = $dialog.find(ADD_COLOR_BUT),
            $removeColor = $dialog.find(REMOVE_COLOR_BUT),
            color = queryParameters()[COLOR],
            $colorPicker = $document.find("coral-colorinput");

        if(!_.isEmpty(color)){
            color = decodeURIComponent(color);

            if(color.indexOf("rgb") == 0){
                color = CUI.util.color.RGBAToHex(color);
            }

            $colorPicker[0].value = color;
        }

        adjustHeader($dialog);

        $colorPicker.css("margin-bottom", "285px");

        $(ADD_COLOR_BUT).css("margin-left", "220px");

        $addColor.click(sendDataMessage);

        $removeColor.click(sendRemoveMessage);
    }

    function adjustHeader($dialog){
        var $header = $dialog.css("background-color", "#fff").find(".coral3-Dialog-header");

        $header.find(".cq-dialog-submit").remove();

        $header.find(".cq-dialog-cancel").click(function(event){
            event.preventDefault();

            $dialog.remove();

            sendCancelMessage();
        });
    }

    function sendCancelMessage(){
        var message = {
            sender: SENDER,
            action: "cancel"
        };

        parent.postMessage(JSON.stringify(message), "*");
    }

    function sendRemoveMessage(){
        var message = {
            sender: SENDER,
            action: "remove"
        };

        parent.postMessage(JSON.stringify(message), "*");
    }

    function sendDataMessage(){
        var message = {
            sender: SENDER,
            action: "submit",
            data: {}
        }, $dialog, color;

        $dialog = $(".cq-dialog");

        color = $dialog.find("[name='./" + COLOR + "']").val();

        if(color && color.indexOf("rgb") >= 0){
            color = CUI.util.color.RGBAToHex(color);
        }

        message.data[COLOR] = color;

        parent.postMessage(JSON.stringify(message), "*");
    }
})(jQuery, jQuery(document));
