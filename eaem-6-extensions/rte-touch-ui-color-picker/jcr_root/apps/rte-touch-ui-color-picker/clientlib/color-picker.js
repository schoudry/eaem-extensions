(function(){
    var ExperienceAEM = {
        TCP_UI_SETTING: "touchuicolorpicker#touchuicolorpicker",
        TCP_FEATURE: "touchuicolorpicker",
        TCP_DIALOG: "touchuicolorpickerdialog"
    };

    ExperienceAEM.CuiToolbarBuilder = new Class({
        toString: "EAEMCuiToolbarBuilder",

        extend: CUI.rte.ui.cui.CuiToolbarBuilder,

        _getUISettings: function(options) {
            var uiSettings = this.superClass._getUISettings(options);

            var items = uiSettings["inline"]["popovers"]["format"].items;

            if(items.indexOf(ExperienceAEM.TCP_UI_SETTING) == -1){
                items.push(ExperienceAEM.TCP_UI_SETTING);
            }

            items = uiSettings["fullscreen"]["toolbar"];

            if(items.indexOf(ExperienceAEM.TCP_UI_SETTING) == -1){
                items.splice(3, 0, ExperienceAEM.TCP_UI_SETTING);
            }

            //add the color picker css to ui settings for toolbar
            if(!this._getClassesForCommand(ExperienceAEM.TCP_UI_SETTING)){
                this.registerAdditionalClasses(ExperienceAEM.TCP_UI_SETTING, "coral-Icon eaem-touchui-color-picker");
            }

            return uiSettings;
        }
    });

    //the popover dialog
    ExperienceAEM.ColorPickerDialog = new Class({
        extend: CUI.rte.ui.cui.AbstractBaseDialog,

        toString: "EAEMColorPickerDialog",

        initialize: function(config) {
            //exec function passes the color value to plugin command
            this.exec = config.execute;
        },

        getDataType: function() {
            return ExperienceAEM.TCP_DIALOG;
        },

        attach: function(config, $container, editorKernel) {
            this.superClass.attach.call(this,config, $container, editorKernel);

            var self = this;

            //to removed previously selected color
            this.$dialog.on("click.rte-dialog", "button[data-type=\"delete\"]",
                function(e) {
                    self.colorPicker.$element.removeAttr("value");
                    self.apply();
                    e.stopPropagation();
                }
            );
        },

        apply: function() {
            this.hide();

            if(!this.colorPicker){
                return;
            }

            var $selection = this.colorPicker.$element.find(".colorpicker-holder").find(".selection");

            var hexCode = $selection.length > 0 ? $selection.find("span:last-child").html() : undefined;

            //pass the color value to command
            this.exec(hexCode);
        },

        cancel: function() {
            this.hide();
        }
    });

    //extend the CUI dialog manager to register color picker dialog
    ExperienceAEM.DialogManager = new Class({
        toString: "EAEMDialogManager",

        extend: CUI.rte.ui.cui.CuiDialogManager,

        create: function(dialogId, config) {
            if(dialogId !== ExperienceAEM.TCP_DIALOG){
                return this.superClass.create.call(this,dialogId, config);
            }

            var context = this.editorKernel.getEditContext();
            var $container = CUI.rte.UIUtils.getUIContainer($(context.root));

            var dialog = new ExperienceAEM.ColorPickerDialog();
            dialog.attach(config, $container, this.editorKernel);

            return dialog;
        }
    });

    //extend CUI toolkit impl to create instances of extended toolbar builder and dialog manager
    ExperienceAEM.ToolkitImpl = new Class({
        toString: "EAEMCuiToolbarBuilder",

        extend: CUI.rte.ui.cui.ToolkitImpl,

        createToolbarBuilder: function() {
            return new ExperienceAEM.CuiToolbarBuilder();
        },

        createDialogManager: function(editorKernel) {
            return new ExperienceAEM.DialogManager(editorKernel);
        }
    });

    CUI.rte.ui.ToolkitRegistry.register("cui", ExperienceAEM.ToolkitImpl);

    //the color picker plugin for touch ui
    ExperienceAEM.TouchUIColorPickerPlugin = new Class({
        toString: "TouchUIColorPickerPlugin",

        extend: CUI.rte.plugins.Plugin,

        pickerUI: null,

        getFeatures: function() {
            return [ ExperienceAEM.TCP_FEATURE ];
        },

        initializeUI: function(tbGenerator) {
            var plg = CUI.rte.plugins;

            //add the color picker
            if (this.isFeatureEnabled(ExperienceAEM.TCP_FEATURE)) {
                this.pickerUI = tbGenerator.createElement(ExperienceAEM.TCP_FEATURE, this, true, "Color Picker");
                tbGenerator.addElement("format", plg.Plugin.SORT_FORMAT, this.pickerUI, 140);
            }
        },

        //executes when user clicks on color picker button to open the picker dialog
        execute: function(id, value, envOptions) {
            var ek = this.editorKernel;
            var dm = ek.getDialogManager();

            if (dm.isShown(this.dialog)) {
                dm.hide(this.dialog);
                return;
            }

            var dialogConfig = {
                execute: function(value) {
                    ek.relayCmd(id, value);
                },
                parameters : {
                    "command": ExperienceAEM.TCP_UI_SETTING
                }
            };

            //create or get existing dialog
            this.dialog = dm.create(ExperienceAEM.TCP_DIALOG, dialogConfig);

            dm.prepareShow(this.dialog);

            dm.show(this.dialog);

            if(!this.dialog.colorPicker){
                //default colors if the colors are not configured for plugin in crx
                var colors = { "White" : "FFFFFF", "Yellow" : "FFFF00" };

                if(this.config.colors){
                    colors = this.config.colors;
                }

                var options = {
                    element : $('[data-rte-dialog="' + ExperienceAEM.TCP_DIALOG + '"] .coral-ColorPicker'),
                    config : {
                        colors: colors,
                        displayModes : {
                            "freestylePalette" : true,
                            "edit" : false
                        }
                    }
                };

                //create the picker
                this.dialog.colorPicker = new CUI.Colorpicker(options);
            }

            var context = envOptions.editContext;

            var selection = CUI.rte.Selection.createProcessingSelection(context);
            var tag = CUI.rte.Common.getTagInPath(context, selection.startNode, "span" );

            //get existing color to initialize picker
            var color = $(tag).css("color");

            if(color){
                this.dialog.colorPicker._setColor(color);
            }
        },

        updateState: function(selDef) {
            var hasColorPicker = this.editorKernel.queryState(ExperienceAEM.TCP_FEATURE, selDef);

            if (this.pickerUI != null) {
                this.pickerUI.setSelected(hasColorPicker);
            }
        }
    });

    CUI.rte.plugins.PluginRegistry.register(ExperienceAEM.TCP_FEATURE,
                                                ExperienceAEM.TouchUIColorPickerPlugin);

    //the command for making text colored
    ExperienceAEM.ColorPickerCmd = new Class({
        toString: "ColorPickerCmd",

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr) {
            return (cmdStr.toLowerCase() == ExperienceAEM.TCP_FEATURE);
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

        execute: function(execDef) {
            var selection = execDef.selection;

            if (!selection) {
                return;
            }

            var nodeList = execDef.nodeList;

            if (!nodeList) {
                return;
            }

            var common = CUI.rte.Common;
            var context = execDef.editContext;

            var tagObj = this._getTagObject(execDef.value);

            //if no color value passed, assume delete and remove color
            if(!execDef.value){
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

        queryState: function(selectionDef) {
            var common = CUI.rte.Common;
            var context = selectionDef.editContext;

            var selection = selectionDef.selection;
            var tagObj = this._getTagObject();

            return (common.getTagInPath(context, selection.startNode, tagObj.tag, tagObj.attributes) != null);
        }
    });

    CUI.rte.commands.CommandRegistry.register(ExperienceAEM.TCP_FEATURE, ExperienceAEM.ColorPickerCmd);

    //returns the picker dialog html
    //Handlebars doesn't do anything useful here, but the framework expects a template
    var cpTemplate = function(){
        CUI.rte.Templates["dlg-" + ExperienceAEM.TCP_DIALOG] =
            Handlebars.compile('<div data-rte-dialog="' + ExperienceAEM.TCP_DIALOG + '" class="coral--dark coral-Popover coral-RichText-dialog">'
                + '<div class="coral-RichText-dialog-columnContainer">'
                    + '<div class="coral-RichText-dialog-column">'
                    +   '<label class="coral-Form-fieldlabel">Select color </label>'
                    + '</div>'
                    + '<div class="coral-RichText-dialog-column">'
                        + '<span  class="coral-Form-field coral-ColorPicker">'
                            + '<button class="coral-ColorPicker-button coral-MinimalButton" type="button"></button>'
                        + '</span>'
                    + '</div>'
                    + '<div class="coral-RichText-dialog-column">'
                        + '<button data-type="apply" class="coral-RichText-dialogButton coral-Icon coral-Icon--check coral-Icon--sizeS coral-RichText--white coral-Button--primary"></button>'
                    + '</div>'
                    + '<div class="coral-RichText-dialog-column">'
                        + '<button data-type="cancel" class="coral-RichText-dialogButton coral-Icon coral-Icon--close coral-Icon--sizeS coral-RichText--white"></button>'
                    + '</div>'
                    + '<div class="coral-RichText-dialog-column">'
                        + '<button data-type="delete" class="coral-RichText-dialogButton coral-Icon coral-Icon--delete coral-Icon--sizeS coral-RichText--white coral-Button--warning"></button>'
                    + '</div>'
                + '</div>'
            + '</div>');
    };

    cpTemplate();
})();
