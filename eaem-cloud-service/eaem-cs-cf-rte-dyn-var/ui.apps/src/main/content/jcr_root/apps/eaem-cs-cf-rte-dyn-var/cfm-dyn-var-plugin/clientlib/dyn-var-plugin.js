(function ($, $document) {
    var EAEM_PLUGIN_ID = "eaem-dyn-var",
        EAEM_TEXT_DYN_VAR_FEATURE = "eaemDynVar",
        EAEM_DYN_VAR_ICON = EAEM_PLUGIN_ID + "#" + EAEM_TEXT_DYN_VAR_FEATURE,
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        DYN_VAR_SELECTOR_URL = "/apps/eaem-cs-cf-rte-dyn-var/cfm-dyn-var-plugin/dyn-var-selector.html",
        SENDER = "experience-aem", REQUESTER = "requester", $eaemDynVarPicker,
        url = document.location.pathname;

    if( url.indexOf("/editor.html") == 0 ){
        extendStyledTextEditor();
        registerPlugin();
    }else if(url.indexOf(DYN_VAR_SELECTOR_URL) == 0){
        handlePicker();
    }

    function handlePicker(){
        $document.on("click", CANCEL_CSS, sendCancelMessage);

        $document.submit(sendSelectedVars);
    }

    function sendSelectedVars(){
        var message = {
            sender: SENDER,
            action: "submit",
            data: {}
        }, $form = $("form"), $field;

        _.each($form.find("[name^='./']"), function(field){
            if(!field.checked || (field.tagName !== "CORAL-CHECKBOX")){
                return;
            }

            $field = $(field);
            message.data[$field.attr("name").substr(2)] = $field.val();
        });

        parent.postMessage(JSON.stringify(message), "*");
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

        var message, action;

        try{
            message = JSON.parse(event.data);
        }catch(err){
            return;
        }

        if (!message || message.sender !== SENDER) {
            return;
        }

        action = message.action;

        if(action === "submit"){
            $eaemDynVarPicker.eaemFontPlugin.editorKernel.execCmd(EAEM_TEXT_DYN_VAR_FEATURE, message.data);
        }

        var modal = $eaemDynVarPicker.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    function extendStyledTextEditor(){
        var origFn = Dam.CFM.StyledTextEditor.prototype._start;

        Dam.CFM.StyledTextEditor.prototype._start = function(){
            addDynVarPluginSettings(this);
            origFn.call(this);
        }
    }

    function addDynVarPluginSettings(editor){
        var config = editor.$editable.data("config");

        config.rtePlugins[EAEM_PLUGIN_ID] = {
            features: "*"
        };

        config.uiSettings.cui.multieditorFullscreen.toolbar.push(EAEM_DYN_VAR_ICON);
        config.uiSettings.cui.inline.toolbar.push(EAEM_DYN_VAR_ICON);
    }

    function registerPlugin(){
        var EAEM_CFM_DYN_VAR_PLUGIN = new Class({
            toString: "eaemCFMDynVarPlugin",

            extend: CUI.rte.plugins.Plugin,

            textFontUI:  null,

            getFeatures: function () {
                return [ EAEM_TEXT_DYN_VAR_FEATURE ];
            },

            notifyPluginConfig: function (pluginConfig) {
                var defaults = {
                    tooltips: {}
                };

                defaults.tooltips[EAEM_TEXT_DYN_VAR_FEATURE] = {
                    title: "Select Dynamic Variable..."
                };

                CUI.rte.Utils.applyDefaults(pluginConfig, defaults);

                this.config = pluginConfig;
            },

            initializeUI: function (tbGenerator) {
                if (!this.isFeatureEnabled(EAEM_TEXT_DYN_VAR_FEATURE)) {
                    return;
                }

                this.textFontUI = new tbGenerator.createElement(EAEM_TEXT_DYN_VAR_FEATURE, this, false,
                                        this.config.tooltips[EAEM_TEXT_DYN_VAR_FEATURE]);

                tbGenerator.addElement(EAEM_TEXT_DYN_VAR_FEATURE, 999, this.textFontUI, 999);

                if (tbGenerator.registerIcon) {
                    tbGenerator.registerIcon(EAEM_DYN_VAR_ICON, "brackets");
                }

                $(window).off('message', closePicker).on('message', closePicker);
            },

            isValidSelection: function(){
                var winSel = window.getSelection();
                return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
            },

            execute: function (pluginCommand, value, envOptions) {
                if (pluginCommand != EAEM_TEXT_DYN_VAR_FEATURE) {
                    return;
                }

                this.showFontModal(this.getPickerIFrameUrl());
            },

            showFontModal: function(url){
                var self = this, $iframe = $('<iframe>'),
                    $modal = $('<div>').addClass('eaem-cfm-font-size coral-Modal');

                $iframe.attr('src', url).appendTo($modal);

                $modal.appendTo('body').modal({
                    type: 'default',
                    buttons: [],
                    visible: true
                });

                $eaemDynVarPicker = $modal;

                $eaemDynVarPicker.eaemFontPlugin = self;

                $modal.nextAll(".coral-Modal-backdrop").addClass("cfm-coral2-backdrop");
            },

            getPickerIFrameUrl: function(){
                return Granite.HTTP.externalize(DYN_VAR_SELECTOR_URL) + "?" + REQUESTER + "=" + SENDER;
            }
        });

        var EAEM_CFM_DYN_VAR_CMD = new Class({
            toString: "eaemDynVarCmd",

            extend: CUI.rte.commands.Command,

            isCommand: function (cmdStr) {
                return (cmdStr.toLowerCase() == EAEM_TEXT_DYN_VAR_FEATURE);
            },

            getProcessingOptions: function () {
                var cmd = CUI.rte.commands.Command;
                return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
            },

            execute: function (execDef) {
                execDef.value = Object.values(execDef.value).join(" ");

                CUI.rte.commands.InsertHtml().execute(execDef);
            },

            queryState: function(selectionDef, cmd) {
                return false;
            }
        });

        CUI.rte.plugins.PluginRegistry.register(EAEM_PLUGIN_ID, EAEM_CFM_DYN_VAR_PLUGIN);

        CUI.rte.commands.CommandRegistry.register(EAEM_TEXT_DYN_VAR_FEATURE, EAEM_CFM_DYN_VAR_CMD);
    }
}(jQuery, jQuery(document)));