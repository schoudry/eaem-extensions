(function($, CUI){
    var GROUP = "experience-aem",
        STRUCTURED_CONTENT_FEATURE = "structuredContentModal",
        TCP_DIALOG = "eaemTouchUIStructuredContentModalDialog",
        CONTENT_IN_DIALOG = "content",
        REQUESTER = "requester",
        PICKER_URL = "/apps/eaem-touchui-rte-structured-content/dialog-modal/cq:dialog.html",
        $eaemStructuredModal, url = document.location.pathname;

    if( url.indexOf(PICKER_URL) !== 0 ){
        addPluginToDefaultUISettings();
        addDialogTemplate();
    }

    var EAEMStructuredContentModalDialog = new Class({
        extend: CUI.rte.ui.cui.AbstractDialog,

        toString: "EAEMStructuredContentModalDialog",

        initialize: function(config) {
            this.exec = config.execute;
        },

        getDataType: function() {
            return TCP_DIALOG;
        }
    });

    var TouchUIStructuredContentModalPlugin = new Class({
        toString: "TouchUIStructuredContentModalPlugin",

        extend: CUI.rte.plugins.Plugin,

        modalUI: null,

        getFeatures: function() {
            return [ STRUCTURED_CONTENT_FEATURE ];
        },

        initializeUI: function(tbGenerator) {
            var plg = CUI.rte.plugins;

            if (!this.isFeatureEnabled(STRUCTURED_CONTENT_FEATURE)) {
                return;
            }

            this.modalUI = tbGenerator.createElement(STRUCTURED_CONTENT_FEATURE, this, false, { title: "RTE Structured Content" });
            tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.modalUI, 10);

            var groupFeature = GROUP + "#" + STRUCTURED_CONTENT_FEATURE;
            tbGenerator.registerIcon(groupFeature, "actions");
        },

        execute: function (id, value, envOptions) {
            if(!isValidSelection()){
                return;
            }

            var context = envOptions.editContext,
                selection = CUI.rte.Selection.createProcessingSelection(context),
                ek = this.editorKernel,
                startNode = selection.startNode;

            if ( (selection.startOffset === startNode.length) && (startNode != selection.endNode)) {
                startNode = startNode.nextSibling;
            }

            var tag = CUI.rte.Common.getTagInPath(context, startNode, "span"), plugin = this, dialog,
                content = $(tag).data("content"),
                dm = ek.getDialogManager(),
                $container = CUI.rte.UIUtils.getUIContainer($(context.root)),
                propConfig = {
                    'parameters': {
                        'command': this.pluginId + '#' + STRUCTURED_CONTENT_FEATURE
                    }
                };

            this.showDialogModal(getModalIFrameUrl(content));

            registerReceiveDataListener(receiveMessage);

            function isValidSelection(){
                var winSel = window.getSelection();
                return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
            }

            function getModalIFrameUrl(content){
                var url = PICKER_URL + "?" + REQUESTER + "=" + GROUP;

                if(!_.isEmpty(content)){
                    url = url + "&" + CONTENT_IN_DIALOG + "=" + content;
                }

                return url;
            }

            function removeReceiveDataListener(handler) {
                if (window.removeEventListener) {
                    window.removeEventListener("message", handler);
                } else if (window.detachEvent) {
                    window.detachEvent("onmessage", handler);
                }
            }

            function registerReceiveDataListener(handler) {
                if (window.addEventListener) {
                    window.addEventListener("message", handler, false);
                } else if (window.attachEvent) {
                    window.attachEvent("onmessage", handler);
                }
            }

            function receiveMessage(event) {
                if (_.isEmpty(event.data)) {
                    return;
                }

                var message = JSON.parse(event.data),
                    action;

                if (!message || message.sender !== GROUP) {
                    return;
                }

                action = message.action;

                if (action === "submit") {
                    if (!_.isEmpty(message.data)) {
                        ek.relayCmd(id, message.data);
                    }
                }else if(action === "cancel"){
                    plugin.eaemStructuredContentModalDialog = null;
                }

                dialog.hide();

                removeReceiveDataListener(receiveMessage);
            }
        },

        showDialogModal: function(url){
            var self = this, $iframe = $('<iframe>'),
                $modal = $('<div>').addClass('eaem-rte-structured-dialog coral-Modal');

            $iframe.attr('src', url).appendTo($modal);

            $modal.appendTo('body').modal({
                type: 'default',
                buttons: [],
                visible: true
            });

            $eaemStructuredModal = $modal;

            $eaemStructuredModal.eaemModalPlugin = self;

            $modal.nextAll(".coral-Modal-backdrop").addClass("cfm-coral2-backdrop");
        },

        //to mark the icon selected/deselected
        updateState: function(selDef) {
            var hasUC = this.editorKernel.queryState(STRUCTURED_CONTENT_FEATURE, selDef);

            if (this.modalUI != null) {
                this.modalUI.setSelected(hasUC);
            }
        }
    });

    CUI.rte.plugins.PluginRegistry.register(GROUP,TouchUIStructuredContentModalPlugin);

    var TouchUIStructuredContentModalCmd = new Class({
        toString: "TouchUIStructuredContentModalCmd",

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr) {
            return (cmdStr.toLowerCase() == STRUCTURED_CONTENT_FEATURE);
        },

        getProcessingOptions: function() {
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
        },

        _getTagObject: function(content) {
            return {
                "tag": "span",
                "attributes": {
                    "data-content" : content
                }
            };
        },

        execute: function (execDef) {
            var content = execDef.value ? execDef.value[CONTENT_IN_DIALOG] : undefined,
                selection = execDef.selection,
                nodeList = execDef.nodeList;

            if (!selection || !nodeList) {
                return;
            }

            var common = CUI.rte.Common,
                context = execDef.editContext,
                tagObj = this._getTagObject(content);

            //if no color value passed, assume delete and remove color
            if(_.isEmpty(content)){
                nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, undefined, true);
                return;
            }

            var tags = common.getTagInPath(context, selection.startNode, tagObj.tag);

            //remove existing color before adding new color
            if (tags != null) {
                nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, undefined, true);
                nodeList.commonAncestor = nodeList.nodes[0].dom.parentNode;
            }

            nodeList.surround(execDef.editContext, tagObj.tag, tagObj.attributes);
        }
    });

    CUI.rte.commands.CommandRegistry.register(STRUCTURED_CONTENT_FEATURE, TouchUIStructuredContentModalCmd);

    function addPluginToDefaultUISettings(){
        var toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.inline.toolbar;
        toolbar.splice(3, 0, GROUP + "#" + STRUCTURED_CONTENT_FEATURE);

        toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.fullscreen.toolbar;
        toolbar.splice(3, 0, GROUP + "#" + STRUCTURED_CONTENT_FEATURE);
    }

    function addDialogTemplate(){
        var url = PICKER_URL + "?" + REQUESTER + "=" + GROUP;

        var html = "<iframe width='600px' height='500px' frameBorder='0' src='" + url + "'></iframe>";

        if(_.isUndefined(CUI.rte.Templates)){
            CUI.rte.Templates = {};
        }

        if(_.isUndefined(CUI.rte.templates)){
            CUI.rte.templates = {};
        }

        CUI.rte.templates['dlg-' + TCP_DIALOG] = CUI.rte.Templates['dlg-' + TCP_DIALOG] = Handlebars.compile(html);
    }
}(jQuery, window.CUI,jQuery(document)));

(function($, $document){
    var SENDER = "experience-aem",
        REQUESTER = "requester",
        CONTENT = "content";

    if(queryParameters()[REQUESTER] !== SENDER ){
        return;
    }

    $(function(){
        _.defer(stylePopoverIframe);
    });

   function queryParameters() {
        var result = {}, param,
            params = document.location.search.split(/\?|\&/);

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }

    function stylePopoverIframe(){
        var queryParams = queryParameters(),
            $dialog = $("coral-dialog");

        if(_.isEmpty($dialog)){
            return;
        }

        $dialog.css("overflow", "hidden").css("background-color", "#fff");

        $dialog[0].open = true;

        var content = queryParameters()[CONTENT];

        if(!_.isEmpty(content)){
            content = decodeURIComponent(content);
        }

        adjustHeader($dialog);
    }

    function adjustHeader($dialog){
        var $header = $dialog.css("background-color", "#fff").find(".coral3-Dialog-header");

        $header.find(".cq-dialog-submit").remove();

        $header.find(".cq-dialog-cancel").click(function(event){
            event.preventDefault();

            $dialog.remove();

            sendCancelMessage();
        });
    }

    function sendCancelMessage(){
        var message = {
            sender: SENDER,
            action: "cancel"
        };

        parent.postMessage(JSON.stringify(message), "*");
    }

    function sendRemoveMessage(){
        var message = {
            sender: SENDER,
            action: "remove"
        };

        parent.postMessage(JSON.stringify(message), "*");
    }

    function sendDataMessage(){
        var message = {
            sender: SENDER,
            action: "submit",
            data: {}
        }, $dialog, content;

        $dialog = $(".cq-dialog");

        content = $dialog.find("[name='./" + CONTENT + "']").val();

        message.data[CONTENT] = content;

        parent.postMessage(JSON.stringify(message), "*");
    }
})(jQuery, jQuery(document));
