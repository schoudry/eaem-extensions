(function($, CUI, $document){
    var GROUP = "experience-aem-fonts",
        FONT_FEATURE = "applyFont",
        url = document.location.pathname;

    addPlugin();

    addPluginToDefaultUISettings();

    function addPluginToDefaultUISettings(){
        var groupFeature = GROUP + "#" + FONT_FEATURE,
            toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.inline.toolbar;

        if(toolbar.includes(groupFeature)){
            return;
        }

        toolbar.splice(3, 0, groupFeature);

        toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.fullscreen.toolbar;
        toolbar.splice(3, 0, groupFeature);

        toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.dialogFullScreen.toolbar;
        toolbar.splice(3, 0, groupFeature);
    }

    function addPlugin(){
        var TouchUIFontPlugin = new Class({
            toString: "TouchUIFontPlugin",

            extend: CUI.rte.plugins.Plugin,

            pickerUI: null,

            getFeatures: function() {
                return [ FONT_FEATURE ];
            },

            initializeUI: function(tbGenerator) {
                var plg = CUI.rte.plugins;

                addPluginToDefaultUISettings();

                if (!this.isFeatureEnabled(FONT_FEATURE)) {
                    return;
                }

                this.pickerUI = tbGenerator.createElement(FONT_FEATURE, this, false, { title: "Select Font..." });
                tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 10);

                var groupFeature = GROUP + "#" + FONT_FEATURE;
                tbGenerator.registerIcon(groupFeature, "abc");
            },

            execute: function (id, value, envOptions) {
            },

            updateState: function(selDef) {
                var hasUC = this.editorKernel.queryState(FONT_FEATURE, selDef);

                if (this.pickerUI != null) {
                    this.pickerUI.setSelected(hasUC);
                }
            }
        });

        CUI.rte.plugins.PluginRegistry.register(GROUP,TouchUIFontPlugin);
    }
}(jQuery, window.CUI,jQuery(document)));