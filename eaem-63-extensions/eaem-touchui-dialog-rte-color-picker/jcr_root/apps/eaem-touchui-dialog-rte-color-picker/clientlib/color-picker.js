(function($, CUI){
    var GROUP = "experience-aem",
        COLOR_PICKER_FEATURE = "colorPicker",
        TCP_DIALOG = "eaemTouchUIColorPickerDialog",
        COLOR_PICKER_MODAL_DIV = "eaem-color-picker",
        PICKER_NAME_IN_POPOVER = "color",
        REQUESTER = "requester",
        PICKER_URL = "/apps/eaem-touchui-dialog-rte-color-picker/color-picker-popover/cq:dialog.html";

    addPluginToDefaultUISettings();

    addDialogTemplate();

    var EAEMColorPickerDialog = new Class({
        extend: CUI.rte.ui.cui.AbstractDialog,

        toString: "EAEMColorPickerDialog",

        initialize: function(config) {
            //exec function passes the color value to plugin command
            this.exec = config.execute;
        },

        getDataType: function() {
            return TCP_DIALOG;
        },

        attach: function(config, $container, editorKernel) {
            this.superClass.attach.call(this, config, $container, editorKernel);
        },

        apply: function() {
            if(!this.eaemColorPickerDialog){
                return;
            }

            var picker = this.eaemColorPickerDialog;

            this.hide();
        },

        cancel: function() {
            this.hide();
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
            var EAEM_COLOR_PICKER_DIALOG_ID = "EAEM_COLOR_PICKER_DIALOG_ID",
                dm = this.editorKernel.getDialogManager(),
                context = this.editorKernel.getEditContext(),
                $container = CUI.rte.UIUtils.getUIContainer($(context.root));

            var propConfig = {
                    'parameters': {
                        'command': this.pluginId + '#' + COLOR_PICKER_FEATURE
                    }
                };

            var dialog = new EAEMColorPickerDialog();
            dialog.attach(propConfig, $container, this.editorKernel);

            dm.show(dialog);

            this.eaemColorPickerDialog = dialog;
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

        var html = '<div class="rte-dialog-columnContainer">' +
                        '<div class="rte-dialog-column">' +
                            "<iframe width='520px' height='405px' frameBorder='0' src='" + url + "'></iframe>" +
                        '</div>' +
                    '</div>';

        if(_.isUndefined(CUI.rte.Templates)){
            CUI.rte.Templates = {};
        }

        if(_.isUndefined(CUI.rte.templates)){
            CUI.rte.templates = {};
        }

        CUI.rte.templates['dlg-' + TCP_DIALOG] = CUI.rte.Templates['dlg-' + TCP_DIALOG] = Handlebars.compile(html);

        //Coral.templates.RichTextEditor['dlg_' + TCP_DIALOG] = Handlebars.compile(html);
    }
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
