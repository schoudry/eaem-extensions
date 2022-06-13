(function ($, $document) {
    var EAEM_PLUGIN_ID = "eaem-token-var",
        EAEM_TOKEN_FEATURE = "eaemTokenVar",
        EAEM_TOKEN_VAR_ICON = EAEM_PLUGIN_ID + "#" + EAEM_TOKEN_FEATURE,
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        TOKEN_PAGE_URL = "/apps/eaem-sites-rte-secure-tokens/rte-tokens.html",
        SENDER = "experience-aem", REQUESTER = "requester", $eaemTokenVarPicker,
        TOKEN_PLACEHOLDER = "${SECURE_CONTENT:ID=TOKEN_PLACEHOLDER}",
        url = document.location.pathname;

    if( (url.indexOf("/editor.html") == 0)
            || ( url.indexOf("/mnt/overlay/dam/cfm/admin/content/v2/fragment-editor.html") == 0) ){
        extendStyledTextEditor();
        registerPlugin();
    }else if(url.indexOf(TOKEN_PAGE_URL) == 0){
        handlePicker();
    }

    function handlePicker(){
        $document.on("click", CANCEL_CSS, sendCancelMessage);

        $document.submit(sendSelectedToken);
    }

    function sendSelectedToken(){
        var message = {
            sender: SENDER,
            action: "submit",
            data: {}
        }, $form = $("form"), $field;

        _.each($form.find("[name^='./']"), function(field){
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
            $eaemTokenVarPicker.eaemTokenPlugin.editorKernel.execCmd(EAEM_TOKEN_FEATURE, message.data);
        }

        var modal = $eaemTokenVarPicker.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    function extendStyledTextEditor(){
        var origFn = Dam.CFM.StyledTextEditor.prototype._start;

        Dam.CFM.StyledTextEditor.prototype._start = function(){
            addTokenVarPluginSettings(this);
            origFn.call(this);
        }
    }

    function addTokenVarPluginSettings(editor){
        var config = editor.$editable.data("config");

        config.rtePlugins[EAEM_PLUGIN_ID] = {
            features: "*"
        };

        config.uiSettings.cui.multieditorFullscreen.toolbar.push(EAEM_TOKEN_VAR_ICON);
        config.uiSettings.cui.inline.toolbar.push(EAEM_TOKEN_VAR_ICON);
    }

    function registerPlugin(){
        var EAEM_CFM_TOKEN_PLUGIN = new Class({
            toString: "eaemCFMTokenVarPlugin",

            extend: CUI.rte.plugins.Plugin,

            textFontUI:  null,

            getFeatures: function () {
                return [ EAEM_TOKEN_FEATURE ];
            },

            notifyPluginConfig: function (pluginConfig) {
                var defaults = {
                    tooltips: {}
                };

                defaults.tooltips[EAEM_TOKEN_FEATURE] = {
                    title: "Select Tokenamic Variable..."
                };

                CUI.rte.Utils.applyDefaults(pluginConfig, defaults);

                this.config = pluginConfig;
            },

            initializeUI: function (tbGenerator) {
                if (!this.isFeatureEnabled(EAEM_TOKEN_FEATURE)) {
                    return;
                }

                this.textFontUI = new tbGenerator.createElement(EAEM_TOKEN_FEATURE, this, false,
                                        this.config.tooltips[EAEM_TOKEN_FEATURE]);

                tbGenerator.addElement(EAEM_TOKEN_FEATURE, 999, this.textFontUI, 999);

                if (tbGenerator.registerIcon) {
                    tbGenerator.registerIcon(EAEM_TOKEN_VAR_ICON, "brackets");
                }

                $(window).off('message', closePicker).on('message', closePicker);
            },

            isValidSelection: function(){
                var winSel = window.getSelection();
                return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
            },

            execute: function (pluginCommand, value, envOptions) {
                if (pluginCommand != EAEM_TOKEN_FEATURE) {
                    return;
                }

                this.showTokenModal(this.getPickerIFrameUrl());
            },

            showTokenModal: function(url){
                var self = this, $iframe = $('<iframe>'),
                    $modal = $('<div>').addClass('eaem-cfm-font-size coral-Modal');

                $iframe.attr('src', url).appendTo($modal);

                $modal.appendTo('body').modal({
                    type: 'default',
                    buttons: [],
                    visible: true
                });

                $eaemTokenVarPicker = $modal;

                $eaemTokenVarPicker.eaemTokenPlugin = self;

                $modal.nextAll(".coral-Modal-backdrop").addClass("cfm-coral2-backdrop");
            },

            getPickerIFrameUrl: function(){
                return Granite.HTTP.externalize(TOKEN_PAGE_URL) + "?" + REQUESTER + "=" + SENDER;
            }
        });

        var EAEM_TOKEN_CMD = new Class({
            toString: "eaemTokenCmd",

            extend: CUI.rte.commands.Command,

            isCommand: function (cmdStr) {
                return (cmdStr.toLowerCase() == EAEM_TOKEN_FEATURE);
            },

            getProcessingOptions: function () {
                var cmd = CUI.rte.commands.Command;
                return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
            },

            execute: function (execDef) {
                execDef.value = Object.values(execDef.value).join("");

                execDef.value = TOKEN_PLACEHOLDER.replace("TOKEN_PLACEHOLDER",execDef.value);

                CUI.rte.commands.InsertHtml().execute(execDef);
            },

            queryState: function(selectionDef, cmd) {
                return false;
            }
        });

        CUI.rte.plugins.PluginRegistry.register(EAEM_PLUGIN_ID, EAEM_CFM_TOKEN_PLUGIN);

        CUI.rte.commands.CommandRegistry.register(EAEM_TOKEN_FEATURE, EAEM_TOKEN_CMD);
    }
}(jQuery, jQuery(document)));