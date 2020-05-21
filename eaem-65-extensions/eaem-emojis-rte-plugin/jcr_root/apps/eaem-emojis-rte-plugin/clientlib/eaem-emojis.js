(function($, CUI, $document){
    var GROUP = "experience-aem-emojis",
        INSERT_EMOJI_FEATURE = "insertEmoji",
        EAEM_INSERT_EMOJI_DIALOG = "eaemTouchUIInsertEmojiDialog",
        SENDER = "experience-aem", REQUESTER = "requester",
        FONT_SELECTOR_URL = "/apps/eaem-emojis-rte-plugin/emoji-selector.html",
        url = document.location.pathname;

    if( url.indexOf(FONT_SELECTOR_URL) == 0 ){
        handlePicker();
        return;
    }

    function handlePicker(){
        $document.on("click", "#eaem-emojis span", addEmojiSelectListener);
    }

    function addEmojiSelectListener(){
        var message = {
            sender: SENDER,
            action: "submit",
            data: {
                emoji: $(this).html()
            }
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    addPlugin();

    addPluginToDefaultUISettings();

    addDialogTemplate();

    function addDialogTemplate(){
        var url = Granite.HTTP.externalize(FONT_SELECTOR_URL) + "?" + REQUESTER + "=" + SENDER;

        var html = "<iframe width='700px' height='300px' frameBorder='0' src='" + url + "'></iframe>";

        if(_.isUndefined(CUI.rte.Templates)){
            CUI.rte.Templates = {};
        }

        if(_.isUndefined(CUI.rte.templates)){
            CUI.rte.templates = {};
        }

        CUI.rte.templates['dlg-' + EAEM_INSERT_EMOJI_DIALOG] = CUI.rte.Templates['dlg-' + EAEM_INSERT_EMOJI_DIALOG] = Handlebars.compile(html);
    }

    function addPluginToDefaultUISettings(){
        var groupFeature = GROUP + "#" + INSERT_EMOJI_FEATURE,
            toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.dialogFullScreen.toolbar;

        if(toolbar.includes(groupFeature)){
            return;
        }

        toolbar.splice(3, 0, groupFeature);
    }

    var EAEMInsertEmojiDialog = new Class({
        extend: CUI.rte.ui.cui.AbstractDialog,

        toString: "EAEMInsertEmojiDialog",

        initialize: function(config) {
            this.exec = config.execute;
        },

        getDataType: function() {
            return EAEM_INSERT_EMOJI_DIALOG;
        }
    });

    function addPlugin(){
        var EAEMTouchUIInsertEmojiPlugin = new Class({
            toString: "EAEMTouchUIInsertEmojiPlugin",

            extend: CUI.rte.plugins.Plugin,

            pickerUI: null,

            getFeatures: function() {
                return [ INSERT_EMOJI_FEATURE ];
            },

            initializeUI: function(tbGenerator) {
                var plg = CUI.rte.plugins;

                addPluginToDefaultUISettings();

                if (!this.isFeatureEnabled(INSERT_EMOJI_FEATURE)) {
                    return;
                }

                this.pickerUI = tbGenerator.createElement(INSERT_EMOJI_FEATURE, this, false, { title: "Select Emoji..." });
                tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 10);

                var groupFeature = GROUP + "#" + INSERT_EMOJI_FEATURE;
                tbGenerator.registerIcon(groupFeature, "heart");
            },

            execute: function (pluginCommand, value, envOptions) {
                var context = envOptions.editContext,
                    ek = this.editorKernel;

                if (pluginCommand != INSERT_EMOJI_FEATURE) {
                    return;
                }

                var dialog,dm = ek.getDialogManager(),
                    $container = CUI.rte.UIUtils.getUIContainer($(context.root)),
                    propConfig = {
                        'parameters': {
                            'command': this.pluginId + '#' + INSERT_EMOJI_FEATURE
                        }
                    };

                if(this.eaemInsertEmojiDialog){
                    dialog = this.eaemInsertEmojiDialog;

                    dialog.$dialog.find("iframe").attr("src", this.getPickerIFrameUrl());
                }else{
                    dialog = new EAEMInsertEmojiDialog();

                    dialog.attach(propConfig, $container, this.editorKernel);

                    dialog.$dialog.find("iframe").attr("src", this.getPickerIFrameUrl());

                    this.eaemInsertEmojiDialog = dialog;

                    $(window).off('message', receiveMessage).on('message', receiveMessage);
                }

                dm.show(dialog);

                function receiveMessage(event) {
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
                        ek.relayCmd(pluginCommand, message.data);
                    }

                    dialog.hide();
                }
            },

            getPickerIFrameUrl: function(){
                return Granite.HTTP.externalize(FONT_SELECTOR_URL) + "?" + REQUESTER + "=" + SENDER;
            },

            updateState: function(selDef) {
                var hasUC = this.editorKernel.queryState(INSERT_EMOJI_FEATURE, selDef);

                if (this.pickerUI != null) {
                    this.pickerUI.setSelected(hasUC);
                }
            }
        });

        var EAEMTouchUIEmojiCmd = new Class({
            toString: "EAEMTouchUIEmojiCmd",

            extend: CUI.rte.commands.Command,

            isCommand: function (cmdStr) {
                return (cmdStr.toLowerCase() == INSERT_EMOJI_FEATURE);
            },

            getProcessingOptions: function () {
                var cmd = CUI.rte.commands.Command;
                return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
            },

            execute: function (execDef) {
                var emoji = execDef.value.emoji, context = execDef.editContext,
                    emojiSpan = context.doc.createElement("span");

                emojiSpan.innerHTML = emoji;

                var range = CUI.rte.Common.ua.isIE ? CUI.rte.Selection.saveNativeSelection(context)
                                        : CUI.rte.Selection.getLeadRange(context);

                range.insertNode(emojiSpan);
            },

            queryState: function(selectionDef, cmd) {
                return false;
            }
        });

        CUI.rte.commands.CommandRegistry.register(INSERT_EMOJI_FEATURE, EAEMTouchUIEmojiCmd);

        CUI.rte.plugins.PluginRegistry.register(GROUP,EAEMTouchUIInsertEmojiPlugin);
    }
}(jQuery, window.CUI,jQuery(document)));