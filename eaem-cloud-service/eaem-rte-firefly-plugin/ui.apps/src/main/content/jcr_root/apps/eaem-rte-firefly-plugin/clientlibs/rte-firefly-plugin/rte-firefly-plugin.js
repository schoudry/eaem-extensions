(function($, CUI, $document){
    const GROUP = "experience-aem",
        FF_IMAGE_FEATURE = "fireFlyImage",
        FF_SERVLET = "/bin/eaem/firefly/generate";

    addPlugin();

    addPluginToDefaultUISettings();

    function addPluginToDefaultUISettings(){
        const groupFeature = GROUP + "#" + FF_IMAGE_FEATURE,
            toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.dialogFullScreen.toolbar;

        if(toolbar.includes(groupFeature)){
            return;
        }

        toolbar.splice(3, 0, groupFeature);
    }

    function addPlugin(){
        const EAEMFireflyPlugin = new Class({
            toString: "EAEMFireflyPlugin",

            extend: CUI.rte.plugins.Plugin,

            pickerUI: null,

            getFeatures: function() {
                return [ FF_IMAGE_FEATURE ];
            },

            initializeUI: function(tbGenerator) {
                const plg = CUI.rte.plugins;

                addPluginToDefaultUISettings();

                if (!this.isFeatureEnabled(FF_IMAGE_FEATURE)) {
                    return;
                }

                this.pickerUI = tbGenerator.createElement(FF_IMAGE_FEATURE, this, false, { title: "Generate Firefly Image..." });
                tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 10);

                const groupFeature = GROUP + "#" + FF_IMAGE_FEATURE;
                tbGenerator.registerIcon(groupFeature, "emotionJoyColor");
            },

            notifyPluginConfig: function (pluginConfig) {
                pluginConfig = pluginConfig || {};

                CUI.rte.Utils.applyDefaults(pluginConfig, {
                    'tooltips': {
                        fireFlyImage: {
                            'title': 'Firefly Image',
                            'text': 'Generate Firefly Image...'
                        }
                    }
                });

                this.config = pluginConfig;
            },

            execute: function (pluginCommand, value, envOptions) {
                const context = envOptions.editContext,
                    ek = this.editorKernel;

                if (pluginCommand != FF_IMAGE_FEATURE) {
                    return;
                }

                if(!isValidSelection()){
                    return;
                }

                const selection = CUI.rte.Selection.createProcessingSelection(context);
                let startNode = selection.startNode;

                if ( (selection.startOffset === startNode.length) && (startNode != selection.endNode)) {
                    startNode = startNode.nextSibling;
                }

                ek.relayCmd(pluginCommand, startNode.nodeValue);

                function isValidSelection(){
                    const winSel = window.getSelection();
                    return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
                }
            }
        });

        const EAEMFireflyCmd = new Class({
            toString: "EAEMFireflyCmd",

            extend: CUI.rte.commands.Command,

            isCommand: function (cmdStr) {
                return (cmdStr.toLowerCase() == FF_IMAGE_FEATURE);
            },

            getProcessingOptions: function () {
                const cmd = CUI.rte.commands.Command;
                return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
            },

            execute: function (execDef) {
                const text = execDef.value, context = execDef.editContext;;

                if (!text) {
                    return;
                }

                $.ajax(FF_SERVLET + "?text=" + text).done((base64Image) => {
                    let html = "<div>" +
                                    "<img src='data:image/jpeg;base64," + base64Image + "' />" +
                                "</div>";
                    context.doc.execCommand('inserthtml', false, html);
                })
            },

            queryState: function(selectionDef, cmd) {
                return false;
            }
        });

        CUI.rte.commands.CommandRegistry.register(FF_IMAGE_FEATURE, EAEMFireflyCmd);

        CUI.rte.plugins.PluginRegistry.register(GROUP,EAEMFireflyPlugin);
    }
}(jQuery, window.CUI,jQuery(document)));