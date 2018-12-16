(function ($, $document) {
    var EAEM_PLUGIN_ID = "eaemfont",
        EAEM_TEXT_FONT_FEATURE = "eaemTextFont",
        EAEM_TEXT_FONT_ICON = EAEM_PLUGIN_ID + "#" + EAEM_TEXT_FONT_FEATURE;

    extendStyledTextEditor();

    function extendStyledTextEditor(){
        var origFn = Dam.CFM.StyledTextEditor.prototype._start;

        Dam.CFM.StyledTextEditor.prototype._start = function(){
            addTextFontPluginSettings(this);
            origFn.call(this);
        }
    }

    function addTextFontPluginSettings(editor){
        var config = editor.$editable.data("config");

        config.rtePlugins[EAEM_PLUGIN_ID] = {
            features: "*"
        };

        config.uiSettings.cui.multieditorFullscreen.toolbar.push(EAEM_TEXT_FONT_ICON);
    }

    var EAEM_CFM_TEXT_FONT_PLUGIN = new Class({
        toString: "eaemCFMTextFontPlugin",

        extend: CUI.rte.plugins.Plugin,

        textFontUI:  null,

        getFeatures: function () {
            return [ EAEM_TEXT_FONT_FEATURE ];
        },

        notifyPluginConfig: function (pluginConfig) {
            var defaults = {
                tooltips: {}
            };

            defaults.tooltips[EAEM_TEXT_FONT_FEATURE] = {
                title: "Set text font size, color..."
            };

            CUI.rte.Utils.applyDefaults(pluginConfig, defaults);

            this.config = pluginConfig;
        },

        initializeUI: function (tbGenerator) {
            if (!this.isFeatureEnabled(EAEM_TEXT_FONT_FEATURE)) {
                return;
            }

            this.textFontUI = new tbGenerator.createElement(EAEM_TEXT_FONT_FEATURE, this,
                                                    false, this.config.tooltips[EAEM_TEXT_FONT_FEATURE]);

            tbGenerator.addElement(EAEM_TEXT_FONT_FEATURE, 999, this.textFontUI, 999);

            if (tbGenerator.registerIcon) {
                tbGenerator.registerIcon(EAEM_TEXT_FONT_ICON, "textColor");
            }
        },

        execute: function (pluginCommand, value, envOptions) {
            var context = envOptions.editContext;

            if (pluginCommand != EAEM_TEXT_FONT_FEATURE) {
                return;
            }

            this.insertTextAttributes(context);
        },

        insertTextAttributes: function(context){
            this.showFontModal();
        },

        showFontModal: function(){
            var pickerUrl = "/aem/assetpicker?mode=single&assettype=images";
            var $iframe = $('<iframe>');
            var $modal = $('<div>').addClass('cfm-asset-picker coral-Modal');

            /* create modal with asset picker */
            $iframe.attr('src', Granite.HTTP.externalize(pickerUrl)).appendTo($modal);

            $modal.appendTo('body').modal({
                type: 'default',
                buttons: [],
                visible: true
            });

            $modal.nextAll(".coral-Modal-backdrop").addClass("cfm-coral2-backdrop");
        }
    });

    CUI.rte.plugins.PluginRegistry.register(EAEM_PLUGIN_ID, EAEM_CFM_TEXT_FONT_PLUGIN);
}(jQuery, jQuery(document)));