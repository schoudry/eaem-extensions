(function($, CUI){
    var ExperienceAEM = {
        GROUP: "experience-aem",
        STRONG_FEATURE: "strong",
        BOLD: "format#bold"
    };

    function getStrongFeature() {
        return ExperienceAEM.GROUP + "#" + ExperienceAEM.STRONG_FEATURE;
    }
 
    //extend toolbar builder to register strong styles
    ExperienceAEM.CuiToolbarBuilder = new Class({
        toString: "EAEMCuiToolbarBuilder",
 
        extend: CUI.rte.ui.cui.CuiToolbarBuilder,
 
        //add strong icon to the existing set
        _getUISettings: function(options) {
            var uiSettings = this.superClass._getUISettings(options),
                strongFeature = getStrongFeature();

            //inline toolbar
            var items = uiSettings["inline"]["popovers"]["format"].items;

            //insert strong feature
            if(items.indexOf(strongFeature) == -1){
                items.push(strongFeature);
            }

            //remove bold feature
            if(items.indexOf(ExperienceAEM.BOLD) >= 0){
                items = items.splice(items.indexOf(ExperienceAEM.BOLD), 1);
            }

            //fullscreen toolbar
            items = uiSettings["fullscreen"]["toolbar"];

            //insert strong feature
            if(items.indexOf(strongFeature) == -1){
                items.splice(3, 0, strongFeature);
            }

            //remove bold feature
            if(items.indexOf(ExperienceAEM.BOLD) >= 0){
                items = items.splice(items.indexOf(ExperienceAEM.BOLD), 1);
            }

            if(!this._getClassesForCommand(strongFeature)){
                this.registerAdditionalClasses(strongFeature, "coral-Icon coral-Icon--textStyle");
            }

            return uiSettings;
        }
    });
 
    ExperienceAEM.ToolkitImpl = new Class({
        toString: "EAEMToolkitImpl",
 
        extend: CUI.rte.ui.cui.ToolkitImpl,
 
        createToolbarBuilder: function() {
            return new ExperienceAEM.CuiToolbarBuilder();
        }
    });
 
    CUI.rte.ui.ToolkitRegistry.register("cui", ExperienceAEM.ToolkitImpl);
 
    ExperienceAEM.TouchUIStrongPlugin = new Class({
        toString: "TouchUIStrongPlugin",
 
        extend: CUI.rte.plugins.Plugin,
 
        pickerUI: null,
 
        getFeatures: function() {
            return [ ExperienceAEM.STRONG_FEATURE ];
        },
 
        initializeUI: function(tbGenerator) {
            var plg = CUI.rte.plugins;
 
            if (this.isFeatureEnabled(ExperienceAEM.STRONG_FEATURE)) {
                this.pickerUI = tbGenerator.createElement(ExperienceAEM.STRONG_FEATURE, this, true, "Wrap Strong");
                tbGenerator.addElement("format", plg.Plugin.SORT_FORMAT, this.pickerUI, 120);
            }
        },
 
        execute: function(id) {
            this.editorKernel.relayCmd(id);
        },
 
        //to mark the strong icon selected/deselected
        updateState: function(selDef) {
            var hasUC = this.editorKernel.queryState(ExperienceAEM.STRONG_FEATURE, selDef);
 
            if (this.pickerUI != null) {
                this.pickerUI.setSelected(hasUC);
            }
        },
 
        notifyPluginConfig: function(pluginConfig) {
            pluginConfig = pluginConfig || { };
 
            var defaults = {
                "tooltips": {
                    "strong": {
                        "title": "Wrap Strong",
                        "text": "Wrap Strong"
                    }
                }
            };
 
            CUI.rte.Utils.applyDefaults(pluginConfig, defaults);
 
            this.config = pluginConfig;
        }
    });
 
    CUI.rte.plugins.PluginRegistry.register(ExperienceAEM.GROUP, ExperienceAEM.TouchUIStrongPlugin);
 
    ExperienceAEM.StrongCmd = new Class({
        toString: "StrongCmd",
 
        extend: CUI.rte.commands.Command,
 
        isCommand: function(cmdStr) {
            return (cmdStr.toLowerCase() == ExperienceAEM.STRONG_FEATURE);
        },
 
        getProcessingOptions: function() {
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
        },
 
        _getTagObject: function() {
            return {
                "tag": "strong"
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
 
        queryState: function(selectionDef) {
            var common = CUI.rte.Common;
            var context = selectionDef.editContext;
 
            var selection = selectionDef.selection;
            var tagObj = this._getTagObject();
 
            return (common.getTagInPath(context, selection.startNode, tagObj.tag, tagObj.attributes) != null);
        }
    });
 
    CUI.rte.commands.CommandRegistry.register(ExperienceAEM.STRONG_FEATURE, ExperienceAEM.StrongCmd);
})($, window.CUI);