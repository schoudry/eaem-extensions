(function($, CUI){
    var GROUP = "experience-aem",
        COLOR_PICKER_FEATURE = "colorPicker",
        COLOR_PICKER_MODAL_DIV = "eaem-color-picker",
        PICKER_NAME_IN_POPOVER = "color",
        REQUESTER = "requester",
        PICKER_URL = "/apps/touchui-dialog-mini-rte-color-picker/color-picker-popover/cq:dialog.html";

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

            this.pickerUI = tbGenerator.createElement(COLOR_PICKER_FEATURE, this, true, "Color Picker");
            tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 120);

            var groupFeature = GROUP + "#" + COLOR_PICKER_FEATURE;
            tbGenerator.registerIcon(groupFeature, "coral-Icon coral-Icon--textColor");
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

            var tag = CUI.rte.Common.getTagInPath(context, startNode, "span"),
                content = this.getPickerIFrameContent($(tag).css("color"));

            this.addModalDiv();

            var modal = new CUI.Modal({
                element : '#' + COLOR_PICKER_MODAL_DIV,
                heading : "Pick a Color",
                content: content
            });

            registerReceiveDataListener(receiveMessage);

            function isValidSelection(){
                var winSel = window.getSelection();
                return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
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
                }

                modal.hide();

                removeReceiveDataListener(receiveMessage);
            }
        },

        //to mark the icon selected/deselected
        updateState: function(selDef) {
            var hasUC = this.editorKernel.queryState(COLOR_PICKER_FEATURE, selDef);

            if (this.pickerUI != null) {
                this.pickerUI.setSelected(hasUC);
            }
        },

        getModalHtml: function(){
            return "<div class=\"coral-Modal-header\">"
                        + "<h2 class=\"coral-Modal-title coral-Heading coral-Heading--2\"></h2>"
                        + "<i class=\"coral-Modal-typeIcon coral-Icon coral-Icon--sizeS\"></i>"
                        + "<button type=\"button\" "
                            + "class=\"coral-MinimalButton coral-Modal-closeButton\" "
                            + "data-dismiss=\"modal\">"
                        + "<i class=\"coral-Icon coral-Icon--sizeXS coral-Icon--close "
                                + "coral-MinimalButton-icon\"></i>" + "</button>"
                    + "</div>"
                    + "<div class=\"coral-Modal-body legacy-margins\"></div>";
        },

        addModalDiv: function(){
            var $modalDiv = $("#" + COLOR_PICKER_MODAL_DIV);

            if (!_.isEmpty($modalDiv) ) {
                return;
            }

            var tag = {
                class: "coral-Modal",
                id: COLOR_PICKER_MODAL_DIV
            };

            var insertModal = $("<div>", tag).hide().html(this.getModalHtml());

            $(document.body).append(insertModal);
        },

        getPickerIFrameContent: function(color){
            var url = PICKER_URL + "?" + REQUESTER + "=" + GROUP;

            if(!_.isEmpty(color)){
                url = url + "&" + PICKER_NAME_IN_POPOVER + "=" + color;
            }

            return "<iframe width='520px' height='405px' frameBorder='0' src='" + url + "'></iframe>";
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
            }

            nodeList.surround(execDef.editContext, tagObj.tag, tagObj.attributes);
        }
    });

    CUI.rte.commands.CommandRegistry.register(COLOR_PICKER_FEATURE, TouchUIColorPickerCmd);
}(jQuery, window.CUI));

(function($, $document){
    var SENDER = "experience-aem",
        REQUESTER = "requester",
        COLOR = "color",
        ADD_COLOR_BUT = "#EAEM_CP_ADD_COLOR",
        REMOVE_COLOR_BUT = "#EAEM_CP_REMOVE_COLOR";

    if(queryParameters()[REQUESTER] !== SENDER ){
        return;
    }

    $document.on("foundation-contentloaded", stylePopoverIframe);

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
        var queryParams = queryParameters();

        var $dialog = $(".cq-dialog").css("background", "white"),
            $addColor = $dialog.find(ADD_COLOR_BUT),
            $removeColor = $dialog.find(REMOVE_COLOR_BUT),
            $colorPicker = $document.find(".coral-ColorPicker"),
            pickerInstance = $colorPicker.data("colorpicker");

        if(!_.isEmpty(queryParameters()[COLOR])){
            pickerInstance._setColor(decodeURIComponent(queryParams[COLOR]));
        }

        $dialog.find(".cq-dialog-header").hide();
        $dialog.find(".cq-dialog-content").css("top", ".1rem");
        $colorPicker.closest(".coral-Form-fieldwrapper").css("margin-bottom", "285px");
        $(ADD_COLOR_BUT).css("margin-left", "250px");

        $addColor.click(sendDataMessage);
        $removeColor.click(sendRemoveMessage);
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
