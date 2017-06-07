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

        var colorPalette = {
            xtype: "colorpalette"
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
            width: 300,
            height: 200,
            items: [ {
                    xtype: "panel",
                    layout: "form",
                    padding: "20px 0 0 10px",
                    items: [ colorPalette ]
            }],
            ok: function() {
                var palette = this.findByType("colorpalette")[0];

                this.close();

                if(palette.value){
                    editorKernel.relayCmd(ExperienceAEM.ColorPicker.ADD_COLOR_CMD, palette.value);
                }
            }
        };

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
        var nodeList = execDef.nodeList;

        if(!nodeList || !execDef.value){
            return;
        }

        //todo: handle color remove
        //add your custom tags here with pre defined css classes or styles
        try{
            nodeList.surround(execDef.editContext, "span", { style: "color:#" + execDef.value } );
        }catch(err){
        }
    },

    execute: function(execDef) {
        if(execDef.command == this.P.ADD_COLOR_CMD){
            this.addColor(execDef);
        }
    }
});

CUI.rte.commands.CommandRegistry.register("colorpicker", ExperienceAEM.ColorPicker.Cmd);