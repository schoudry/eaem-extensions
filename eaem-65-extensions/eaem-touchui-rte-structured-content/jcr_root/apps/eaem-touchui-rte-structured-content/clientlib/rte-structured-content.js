(function($, CUI, $document){
    var GROUP = "experience-aem",
        STRUCTURED_CONTENT_FEATURE = "structuredContentModal",
        TCP_DIALOG = "eaemTouchUIStructuredContentModalDialog",
        CONTENT_IN_DIALOG = "content",
        REQUESTER = "requester",
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        MODAL_URL = "/apps/eaem-touchui-rte-structured-content/structured-content.html",
        $eaemStructuredModal, url = document.location.pathname;

    if( url.indexOf(MODAL_URL) !== 0 ){
        addPluginToDefaultUISettings();

        addDialogTemplate();

        addPlugin();
    }else{
        $document.on("foundation-contentloaded", fillDefaultValues);

        $document.on("click", CANCEL_CSS, sendCancelMessage);

        $document.submit(sendTextAttributes);
    }

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

    function sendTextAttributes(){
        var message = {
            sender: GROUP,
            action: "submit",
            data: {}
        }, $form = $("form"), $field;

        _.each($form.find("[name]"), function(field){
            $field = $(field);
            message.data[$field.attr("name")] = $field.val();
        });

        parent.postMessage(JSON.stringify(message), "*");
    }

    function fillDefaultValues(){
        var queryParams = queryParameters(),
            form = $("form")[0];
    }

    function sendCancelMessage(){
        var message = {
            sender: GROUP,
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

    function closeDialogModal(event){
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

        if (!message || message.sender !== GROUP) {
            return;
        }

        action = message.action;

        if(action === "submit"){
            $eaemStructuredModal.eaemModalPlugin.editorKernel.execCmd(STRUCTURED_CONTENT_FEATURE, message.data);
        }

        var modal = $eaemStructuredModal.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    function addPluginToDefaultUISettings(){
        var toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.inline.toolbar;
        toolbar.splice(3, 0, GROUP + "#" + STRUCTURED_CONTENT_FEATURE);

        toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.fullscreen.toolbar;
        toolbar.splice(3, 0, GROUP + "#" + STRUCTURED_CONTENT_FEATURE);
    }

    function addDialogTemplate(){
        var url = MODAL_URL + "?" + REQUESTER + "=" + GROUP;

        var html = "<iframe width='600px' height='500px' frameBorder='0' src='" + url + "'></iframe>";

        if(_.isUndefined(CUI.rte.Templates)){
            CUI.rte.Templates = {};
        }

        if(_.isUndefined(CUI.rte.templates)){
            CUI.rte.templates = {};
        }

        CUI.rte.templates['dlg-' + TCP_DIALOG] = CUI.rte.Templates['dlg-' + TCP_DIALOG] = Handlebars.compile(html);
    }

    function addPlugin(){
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

                this.modalUI = tbGenerator.createElement(STRUCTURED_CONTENT_FEATURE, this, false, { title: "Add tooltip" });
                tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.modalUI, 10);

                var groupFeature = GROUP + "#" + STRUCTURED_CONTENT_FEATURE;
                tbGenerator.registerIcon(groupFeature, "more");

                $(window).off('message', closeDialogModal).on('message', closeDialogModal);
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

                function isValidSelection(){
                    var winSel = window.getSelection();
                    return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
                }

                function getModalIFrameUrl(content){
                    var url = MODAL_URL + "?" + REQUESTER + "=" + GROUP;

                    if(!_.isEmpty(content)){
                        url = url + "&" + CONTENT_IN_DIALOG + "=" + content;
                    }

                    return url;
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
    }
}(jQuery, window.CUI,jQuery(document)));
