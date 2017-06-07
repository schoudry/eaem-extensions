CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.ColorPicker = {
    ADD_COLOR_CMD : "addcolor"
};

ExperienceAEM.ColorPicker.Plugin = new Class({
    toString: "ColorPickerPlugin",
    extend: CUI.rte.plugins.Plugin,
    P: ExperienceAEM.ColorPicker,

    addPickerUI: null,

    getFeatures: function() {
        return [ this.P.ADD_COLOR_CMD ];
    },

    initializeUI: function(tbGenerator) {
        var plg = CUI.rte.plugins;

        if (this.isFeatureEnabled(this.P.ADD_COLOR_CMD)) {
            this.addPickerUI = tbGenerator.createElement(this.P.ADD_COLOR_CMD, this, true, "Add Color");
            tbGenerator.addElement("format", plg.Plugin.SORT_FORMAT,this.addPickerUI,1000);
        }
    },

    execute: function(cmd, value, env) {
        if (cmd == this.P.ADD_COLOR_CMD) {
            this.showDialog(env.editContext);
        }
    },

    showDialog: function(context) {
        var editorKernel = this.editorKernel, dm = editorKernel.getDialogManager();
        var config = this.config;

        var colorField = new CQ.form.ColorField({
            fieldLabel: "Hex Value",
            showHexValue: true
        });

        var colorPalette = {
            fieldLabel: "Select",
            labelStyle: "padding-top:15px",
            style: "padding-top:15px",
            xtype: "colorpalette",
            listeners: {
                select: function(t, sColor){
                    colorField.setValue(sColor);
                }
            }
        };

        if(config){
            if(config.defaultColor){
                colorPalette.value = config.defaultColor;
            }

            if(config.colors && config.colors.length > 0){
                colorPalette.colors = config.colors;
            }
        }

        var dialogConfig = {
            "jcr:primaryType": "cq:Dialog",
            title: "Color Picker",
            modal: true,
            width: 400,
            height: 250,
            items: [ {
                    xtype: "panel",
                    layout: "form",
                    padding: "20px 0 0 10px",
                    items: [ colorField, colorPalette ]
            }],
            ok: function() {
                this.close();

                var sColor = colorField.getValue();

                if(sColor){
                    editorKernel.relayCmd(ExperienceAEM.ColorPicker.ADD_COLOR_CMD, sColor );
                }
            }
        };

        var removeBtn = new CQ.Ext.Button( {
            text: "Remove Applied Color",
            width: 150,
            tooltip: 'Remove applied color and close dialog',
            handler: function(){
                this.close();
                editorKernel.relayCmd(ExperienceAEM.ColorPicker.ADD_COLOR_CMD);
            }
        });

        dialogConfig.buttons = [
            removeBtn,
            CQ.Dialog.OK,
            CQ.Dialog.CANCEL
        ];

        dm.show(CQ.WCM.getDialog(dialogConfig));
    },

    notifyPluginConfig: function(pluginConfig) {
        pluginConfig = pluginConfig || { };

        CUI.rte.Utils.applyDefaults(pluginConfig, {
            "tooltips": {
                "addcolor": {
                    "title": "Add Color",
                    "text": "Add Color"
                }
            }
        });

        this.config = pluginConfig;
    },

    updateState: function(selDef) {
        if(this.addPickerUI){
            this.addPickerUI.setSelected(false);
        }
    }
});

CUI.rte.plugins.PluginRegistry.register("colorpicker", ExperienceAEM.ColorPicker.Plugin);

ExperienceAEM.ColorPicker.Cmd = new Class({
    toString: "ColorPicker",
    extend: CUI.rte.commands.Command,

    P: ExperienceAEM.ColorPicker,

    isCommand: function(cmdStr) {
        return (cmdStr == this.P.ADD_COLOR_CMD);
    },

    getProcessingOptions: function() {
        var cmd = CUI.rte.commands.Command;
        return cmd.PO_SELECTION | cmd.PO_NODELIST;
    },

    addColor: function(execDef){
        var nodeList = execDef.nodeList,
            selection = execDef.selection;

        if(!nodeList || !selection){
            return;
        }

        try{
            nodeList.removeNodesByTag(execDef.editContext, "span", undefined, true);

            if(!execDef.value){
                return;
            }

            nodeList.surround(execDef.editContext, "span", { style: "color:#" + execDef.value } );
        }catch(err){
            console.log("Error applying or removing color - " + err);
        }
    },

    execute: function(execDef) {
        if(execDef.command == this.P.ADD_COLOR_CMD){
            this.addColor(execDef);
        }
    }
});

CUI.rte.commands.CommandRegistry.register("colorpicker", ExperienceAEM.ColorPicker.Cmd);