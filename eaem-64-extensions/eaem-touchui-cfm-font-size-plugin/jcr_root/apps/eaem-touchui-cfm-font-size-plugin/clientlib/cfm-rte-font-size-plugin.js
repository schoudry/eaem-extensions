(function ($, $document) {
    var EAEM_PLUGIN_ID = "eaemfont",
        EAEM_TEXT_FONT_FEATURE = "eaemTextFont",
        EAEM_TEXT_FONT_ICON = EAEM_PLUGIN_ID + "#" + EAEM_TEXT_FONT_FEATURE,
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        FONT_SELECTOR_URL = "/apps/eaem-touchui-cfm-font-size-plugin/font-selector.html",
        SENDER = "experience-aem", $eaemFontPicker,
        url = document.location.pathname;

    if( url.indexOf("/editor.html") == 0 ){
        extendStyledTextEditor();

        registerPlugin();
    }else if(url.indexOf(FONT_SELECTOR_URL) == 0){
        handlePicker();
    }

    function handlePicker(){
        $document.on("click", CANCEL_CSS, sendCancelMessage);
    }

    function sendCancelMessage(){
        var message = {
            sender: SENDER,
            action: "cancel"
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    function closePicker(event){
        event = event.originalEvent || {};

        if (_.isEmpty(event.data)) {
            return;
        }

        var message = JSON.parse(event.data),
            action;

        if (!message || message.sender !== SENDER) {
            return;
        }

        action = message.action;

        if(action === "cancel"){
            var modal = $eaemFontPicker.data('modal');
            modal.hide();
            modal.$element.remove();
        }
    }

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

    function registerPlugin(){
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

                $(window).off('message', closePicker)
                    .on('message', closePicker);
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
                var $iframe = $('<iframe>'),
                    $modal = $('<div>').addClass('eaem-cfm-font-size coral-Modal');

                $iframe.attr('src', Granite.HTTP.externalize(FONT_SELECTOR_URL)).appendTo($modal);

                $modal.appendTo('body').modal({
                    type: 'default',
                    buttons: [],
                    visible: true
                });

                $eaemFontPicker = $modal;

                $modal.nextAll(".coral-Modal-backdrop").addClass("cfm-coral2-backdrop");
            }
        });

        CUI.rte.plugins.PluginRegistry.register(EAEM_PLUGIN_ID, EAEM_CFM_TEXT_FONT_PLUGIN);
    }
}(jQuery, jQuery(document)));