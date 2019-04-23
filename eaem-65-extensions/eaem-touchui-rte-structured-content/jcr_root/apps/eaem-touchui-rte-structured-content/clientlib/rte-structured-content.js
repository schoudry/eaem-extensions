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

    function getHtmlFromContent(selectedText, content){
        var tooltipText = content.title + " : " + content.description;

        return "<span title='" + tooltipText + "' class='eaem-dotted-underline' data-content='" +  JSON.stringify(content) + "'>" +
                    selectedText +
                "</span>";
    }

    function setWidgetValue(form, selector, value){
        Coral.commons.ready(form.querySelector(selector), function (field) {
            field.value = _.isEmpty(value) ? "" : decodeURIComponent(value);
        });
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

        if(_.isEmpty(queryParams[CONTENT_IN_DIALOG])){
            return;
        }

        var content = JSON.parse(decodeURIComponent(queryParams[CONTENT_IN_DIALOG]));

        _.each(content, function(value, key){
            setWidgetValue(form, "[name='" + key + "']", value);
        });
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
            var ek = $eaemStructuredModal.eaemModalPlugin.editorKernel,
                tooltipHtml = getHtmlFromContent(window.getSelection().toString(), message.data);

            ek.execCmd('inserthtml', tooltipHtml);
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
                    content = $(tag).data("content");

                this.showDialogModal(getModalIFrameUrl(content));

                function isValidSelection(){
                    var winSel = window.getSelection();
                    return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
                }

                function getModalIFrameUrl(content){
                    var url = MODAL_URL + "?" + REQUESTER + "=" + GROUP;

                    if(_.isObject(content)){
                        url = url + "&" + CONTENT_IN_DIALOG + "=" + JSON.stringify(content);
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
    }
}(jQuery, window.CUI,jQuery(document)));
