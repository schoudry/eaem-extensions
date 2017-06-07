(function(){
    var ExperienceAEM = {
        GROUP: "experience-aem",
        TUC_FEATURE: "touchuitouppercase"
    };

    ExperienceAEM.TouchUIUpperCasePlugin = new Class({
        toString: "TouchUIUpperCasePlugin",

        extend: CUI.rte.plugins.Plugin,

        pickerUI: null,

        getFeatures: function() {
            return [ ExperienceAEM.TUC_FEATURE ];
        },

        initializeUI: function(tbGenerator) {
            var plg = CUI.rte.plugins;

            if (!this.isFeatureEnabled(ExperienceAEM.TUC_FEATURE)) {
                return;
            }

            this.pickerUI = tbGenerator.createElement(ExperienceAEM.TUC_FEATURE, this, true, "To Upper Case");
            tbGenerator.addElement(ExperienceAEM.GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 120);

            var groupFeature = ExperienceAEM.GROUP + "#" + ExperienceAEM.TUC_FEATURE;
            tbGenerator.registerIcon(groupFeature, "coral-Icon coral-Icon--thumbUp");
        },

        execute: function(id) {
            this.editorKernel.relayCmd(id);
        },

        //to mark the uppercase icon selected/deselected
        updateState: function(selDef) {
            var hasUC = this.editorKernel.queryState(ExperienceAEM.TUC_FEATURE, selDef);

            if (this.pickerUI != null) {
                this.pickerUI.setSelected(hasUC);
            }
        },

        notifyPluginConfig: function(pluginConfig) {
            pluginConfig = pluginConfig || { };

            var defaults = {
                "tooltips": {
                    "touchuitouppercase": {
                        "title": "To Upper Case",
                        "text": "To Upper Case"
                    }
                }
            };

            CUI.rte.Utils.applyDefaults(pluginConfig, defaults);

            this.config = pluginConfig;
        }
    });

    CUI.rte.plugins.PluginRegistry.register(ExperienceAEM.GROUP,ExperienceAEM.TouchUIUpperCasePlugin);

    ExperienceAEM.UpperCaseCmd = new Class({
        toString: "UpperCaseCmd",

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr) {
            return (cmdStr.toLowerCase() == ExperienceAEM.TUC_FEATURE);
        },

        getProcessingOptions: function() {
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
        },

        _getTagObject: function() {
            return {
                "tag": "span",
                "attributes": {
                    "style" : "text-transform:uppercase"
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

            var tagObj = this._getTagObject();

            var tags = common.getTagInPath(context, selection.startNode, tagObj.tag, tagObj.attributes);

            if (tags == null) {
                nodeList.surround(execDef.editContext, tagObj.tag, tagObj.attributes);
            } else {
                nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, tagObj.attributes, true);
            }
        },

        queryState: function(selectionDef, cmd) {
            var common = CUI.rte.Common;
            var context = selectionDef.editContext;

            var selection = selectionDef.selection;
            var tagObj = this._getTagObject();

            return (common.getTagInPath(context, selection.startNode, tagObj.tag, tagObj.attributes) != null);
        }
    });

    CUI.rte.commands.CommandRegistry.register(ExperienceAEM.TUC_FEATURE, ExperienceAEM.UpperCaseCmd);
})();
