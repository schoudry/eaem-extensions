(function ($, $document, Handlebars) {
    "use strict";

    var _ = window._,
        Class = window.Class,
        CUI = window.CUI,
        REQUESTER = "requester",
        GROUP = "experience-aem",
        COLOR_PICKER_FEATURE = "colorPicker",
        COLOR_PICKER_DIALOG = "colorPickerDialog",
        DIALOG_URL = "/apps/touchui-rte-color-picker-plugin/color-picker-popover/cq:dialog",
        PICKER_NAME_IN_POPOVER = "color",
        EAEMCuiToolbarBuilder,
        EAEMColorPickerPluginDialog,
        EAEMDialogManager,
        EAEMToolkitImpl,
        EAEMColorPickerPlugin,
        EAEMColorPickerCmd;

    function getUISetting() {
        return GROUP + "#" + COLOR_PICKER_FEATURE;
    }

    //extend the toolbar builder to register plugin icon in fullscreen mode
    EAEMCuiToolbarBuilder = new Class({
        toString: "EAEMCuiToolbarBuilder",

        extend: CUI.rte.ui.cui.CuiToolbarBuilder,

        _getUISettings: function (options) {
            var uiSettings = this.superClass._getUISettings(options),
                toolbar = uiSettings.fullscreen.toolbar,
                feature = getUISetting();

            if (toolbar.indexOf(feature) === -1) {
                toolbar.splice(3, 0, feature);
            }

            if (!this._getClassesForCommand(feature)) {
                //.coral-ColorPicker-button
                this.registerAdditionalClasses(feature, "coral-Icon coral-Icon--textColor");
            }

            return uiSettings;
        }
    });

    //popover dialog hosting iframe
    EAEMColorPickerPluginDialog = new Class({
        extend: CUI.rte.ui.cui.AbstractBaseDialog,

        toString: "EAEMColorPickerPluginDialog",

        getDataType: function () {
            return COLOR_PICKER_DIALOG;
        }
    });

    //extend the CUI dialog manager to register popover dialog
    EAEMDialogManager = new Class({
        toString: "EAEMDialogManager",

        extend: CUI.rte.ui.cui.CuiDialogManager,

        create: function (dialogId, config) {
            if (dialogId !== COLOR_PICKER_DIALOG) {
                return this.superClass.create.call(this, dialogId, config);
            }

            var context = this.editorKernel.getEditContext(),
                $container = CUI.rte.UIUtils.getUIContainer($(context.root)),
                dialog = new EAEMColorPickerPluginDialog();

            dialog.attach(config, $container, this.editorKernel, true);

            return dialog;
        }
    });

    //extend the toolkit implementation for custom toolbar builder and dialog manager
    EAEMToolkitImpl = new Class({
        toString: "EAEMToolkitImpl",

        extend: CUI.rte.ui.cui.ToolkitImpl,

        createToolbarBuilder: function () {
            return new EAEMCuiToolbarBuilder();
        },

        createDialogManager: function (editorKernel) {
            return new EAEMDialogManager(editorKernel);
        }
    });

    CUI.rte.ui.ToolkitRegistry.register("cui", EAEMToolkitImpl);

    EAEMColorPickerPlugin = new Class({
        toString: "ColorPickerDialogPlugin",

        extend: CUI.rte.plugins.Plugin,

        pickerUI: null,

        getFeatures: function () {
            return [ COLOR_PICKER_FEATURE ];
        },

        initializeUI: function (tbGenerator) {
            var plg = CUI.rte.plugins;

            if (!this.isFeatureEnabled(COLOR_PICKER_FEATURE)) {
                return;
            }

            this.pickerUI = tbGenerator.createElement(COLOR_PICKER_FEATURE,
                this, true, "Select Color");

            tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 120);
        },

        execute: function (id, value, envOptions) {
            var ek = this.editorKernel,
                dm = ek.getDialogManager(),
                $popover, dialog, context = envOptions.editContext;

            if(!isValidSelection()){
                return;
            }

            var dialogConfig = {
                parameters: {
                    "command": getUISetting()
                }
            };

            dialog = this.dialog = dm.create(COLOR_PICKER_DIALOG, dialogConfig);

            dialog.restoreSelectionOnHide = false;

            dm.prepareShow(this.dialog);

            dm.show(this.dialog);

            $popover = this.dialog.$dialog.find(".coral-Popover-content");

            var selection = CUI.rte.Selection.createProcessingSelection(context),
                tag = CUI.rte.Common.getTagInPath(context, selection.startNode, "span" );

            loadPopoverUI($popover, $(tag).css("color"));

            function isValidSelection(){
                var winSel = window.getSelection();
                return winSel && winSel.type && winSel.type.toUpperCase() == "RANGE";
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

                dialog.hide();

                removeReceiveDataListener(receiveMessage);
            }

            function loadPopoverUI($popover, color) {
                var url = DIALOG_URL + ".html?" + REQUESTER + "=" + GROUP;

                if(!_.isEmpty(color)){
                    url = url + "&" + PICKER_NAME_IN_POPOVER + "=" + color;
                }

                $popover.parent().css("width", ".1px").height(".1px").css("border", "none");
                $popover.css("width", ".1px").height(".1px");
                $popover.find("iframe").attr("src", url);

                //receive the dialog values from child window
                registerReceiveDataListener(receiveMessage);
            }
        },

        //to mark the icon selected/deselected
        updateState: function (selDef) {
            var hasUC = this.editorKernel.queryState(COLOR_PICKER_FEATURE, selDef);

            if (this.pickerUI !== null) {
                this.pickerUI.setSelected(hasUC);
            }
        }
    });

    CUI.rte.plugins.PluginRegistry.register(GROUP, EAEMColorPickerPlugin);

    EAEMColorPickerCmd = new Class({
        toString: "ColorPickerDialogCmd",

        extend: CUI.rte.commands.Command,

        isCommand: function (cmdStr) {
            return (cmdStr.toLowerCase() === COLOR_PICKER_FEATURE);
        },

        getProcessingOptions: function () {
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST
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

    CUI.rte.commands.CommandRegistry.register(COLOR_PICKER_FEATURE, EAEMColorPickerCmd);

    //returns the picker dialog html
    //Handlebars doesn't do anything useful here, but the framework expects a template
    function dlgTemplate() {
        CUI.rte.Templates["dlg-" + COLOR_PICKER_DIALOG] =
            Handlebars.compile('<div data-rte-dialog="' + COLOR_PICKER_DIALOG +
                '" class="coral--dark coral-Popover coral-RichText-dialog">' +
                '<iframe width="525px" height="465px"></iframe>' +
                '</div>');
    }

    dlgTemplate();
})(jQuery, jQuery(document), Handlebars);

(function($, $document){
    var SENDER = "experience-aem",
        REQUESTER = "requester",
        COLOR = "color",
        ADD_COLOR_BUT = "#EAEM_CP_ADD_COLOR",
        REMOVE_COLOR_BUT = "#EAEM_CP_REMOVE_COLOR",
        PICKER_COLORS = location.pathname.replace(".html", "") + "/content/items/column/items/picker/colors.infinity.json",
        HELP_BUTTON_SEL = ".cq-dialog-help",
        CANCEL_BUTTON_SEL = ".cq-dialog-cancel",
        SUBMIT_BUTTON_SEL = ".cq-dialog-submit",
        pickerInstance;

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

        if(!_.isEmpty(queryParameters()[COLOR])){
            pickerInstance._setColor(decodeURIComponent(queryParams[COLOR]));
        }

        var $dialog = $(".cq-dialog"),
            $cancel = $dialog.find(CANCEL_BUTTON_SEL),
            $submit = $dialog.find(SUBMIT_BUTTON_SEL),
            $addColor = $dialog.find(ADD_COLOR_BUT),
            $removeColor = $dialog.find(REMOVE_COLOR_BUT);

        $dialog.css("border", "solid 2px");
        $dialog.find(HELP_BUTTON_SEL).hide();
        $document.find(".coral-ColorPicker").closest(".coral-Form-fieldwrapper")
            .css("margin-bottom", "20px");

        $document.off("click", CANCEL_BUTTON_SEL);
        $document.off("click", SUBMIT_BUTTON_SEL);
        $document.off("submit");

        $cancel.click(sendCloseMessage);
        $submit.click(sendDataMessage);
        $addColor.click(sendDataMessage);
        $removeColor.click(sendRemoveMessage);
    }

    function sendCloseMessage(){
        var message = {
            sender: SENDER,
            action: "close"
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

    CUI.Colorpicker = new Class({
        toString: "Colorpicker",
        extend: CUI.Colorpicker,

        _readDataFromMarkup: function () {
            this.superClass._readDataFromMarkup.call(this);

            var el = this.$element;

            //extend otb CUI.Colorpicker to workaround the pickerModes bug
            //in granite/ui/components/foundation/form/colorpicker/render.jsp
            //colorpickerJson.put("modes", pickerModes); should have been
            //colorpickerJson.put("pickerModes", pickerModes);
            if (el.data('config').modes) {
                this.options.config.displayModes = el.data('config').modes;
            }

            pickerInstance = this;

            function setColors(data){
                if(_.isEmpty(data)){
                    return;
                }

                var colors = {};

                _.each(data, function(color, key){
                    if(key.indexOf("jcr:") >= 0){
                        return;
                    }

                    colors[color.name] = color.value;
                });

                pickerInstance.options.config.colors = colors;
            }

            $.ajax({ url: PICKER_COLORS, async: false, dataType: 'json' } ).done(setColors);
        }
    });

    CUI.Widget.registry.register("colorpicker", CUI.Colorpicker);
})(jQuery, jQuery(document));