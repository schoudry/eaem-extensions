(function($, CUI, $document){
    var GROUP = "experience-aem-fonts",
        FONT_FEATURE = "applyFont",
        EAEM_APPLY_FONT_DIALOG = "eaemTouchUIApplyFontDialog",
        SENDER = "experience-aem", REQUESTER = "requester", $eaemFontPicker,
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        FONT_SELECTOR_URL = "/apps/eaem-fonts-plugin/font-selector.html",
        url = document.location.pathname;

    if( url.indexOf(FONT_SELECTOR_URL) == 0 ){
        handlePicker();
        return;
    }

    function handlePicker(){
        $document.on("foundation-contentloaded", fillDefaultValues);

        $document.on("click", CANCEL_CSS, sendCancelMessage);

        $document.submit(sentTextAttributes);
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

    function setWidgetValue(form, selector, value){
        Coral.commons.ready(form.querySelector(selector), function (field) {
            field.value = _.isEmpty(value) ? "" : decodeURIComponent(value);
        });
    }

    function fillDefaultValues(){
        var queryParams = queryParameters(),
            form = $("form")[0];

        setWidgetValue(form, "[name='./color']", queryParams.color);

        setWidgetValue(form, "[name='./size']", queryParams.size);

        setWidgetValue(form, "[name='./bgColor']", queryParams.bgColor);
    }

    function sentTextAttributes(){
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
            $eaemFontPicker.eaemFontPlugin.editorKernel.execCmd(FONT_FEATURE, message.data);
        }

        var modal = $eaemFontPicker.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    addPlugin();

    addPluginToDefaultUISettings();

    addDialogTemplate();

    function addDialogTemplate(){
        var url = Granite.HTTP.externalize(FONT_SELECTOR_URL) + "?" + REQUESTER + "=" + SENDER;

        var html = "<iframe width='700px' height='500px' frameBorder='0' src='" + url + "'></iframe>";

        if(_.isUndefined(CUI.rte.Templates)){
            CUI.rte.Templates = {};
        }

        if(_.isUndefined(CUI.rte.templates)){
            CUI.rte.templates = {};
        }

        CUI.rte.templates['dlg-' + EAEM_APPLY_FONT_DIALOG] = CUI.rte.Templates['dlg-' + EAEM_APPLY_FONT_DIALOG] = Handlebars.compile(html);
    }

    function rgbToHex(color){
        if(_.isEmpty(color)){
            return color;
        }

        if(color.indexOf("rgb") == 0){
            color = CUI.util.color.RGBAToHex(color);
        }

        return color;
    }

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

    var EAEMApplyFontDialog = new Class({
        extend: CUI.rte.ui.cui.AbstractDialog,

        toString: "EAEMApplyFontDialog",

        initialize: function(config) {
            this.exec = config.execute;
        },

        getDataType: function() {
            return EAEM_APPLY_FONT_DIALOG;
        }
    });

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

            execute: function (pluginCommand, value, envOptions) {
                var context = envOptions.editContext,
                    ek = this.editorKernel;

                if (pluginCommand != FONT_FEATURE) {
                    return;
                }

                if(!isValidSelection()){
                    return;
                }

                var selection = CUI.rte.Selection.createProcessingSelection(context),
                    startNode = selection.startNode;

                if ( (selection.startOffset === startNode.length) && (startNode != selection.endNode)) {
                    startNode = startNode.nextSibling;
                }

                var $tag = $(CUI.rte.Common.getTagInPath(context, startNode, "span")),
                    size = $tag.css("font-size"),
                    plugin = this, dialog,
                    dm = ek.getDialogManager(),
                    $container = CUI.rte.UIUtils.getUIContainer($(context.root)),
                    propConfig = {
                        'parameters': {
                            'command': this.pluginId + '#' + FONT_FEATURE
                        }
                    };

                var color = this.getColorAttributes($tag);

                if(this.eaemApplyFontDialog){
                    dialog = this.eaemApplyFontDialog;
                }else{
                    dialog = new EAEMApplyFontDialog();

                    dialog.attach(propConfig, $container, this.editorKernel);

                    dialog.$dialog.css("-webkit-transform", "scale(0.9)").css("-webkit-transform-origin", "0 0")
                        .css("-moz-transform", "scale(0.9)").css("-moz-transform-origin", "0px 0px");

                    dialog.$dialog.find("iframe").attr("src", this.getPickerIFrameUrl(size, color.color, color.bgColor));

                    this.eaemApplyFontDialog = dialog;
                }

                dm.show(dialog);

                function isValidSelection(){
                    var winSel = window.getSelection();
                    return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
                }
            },

            getColorAttributes: function($tag){
                var key, color = { color: "", bgColor : ""};

                if(!$tag.attr("style")){
                    return color;
                }

                //donot use .css("color"), it returns default font color, if color is not set
                var parts = $tag.attr("style").split(";");

                _.each(parts, function(value){
                    value = value.split(":");

                    key = value[0] ? value[0].trim() : "";
                    value = value[1] ? value[1].trim() : "";

                    if(key == "color"){
                        color.color = rgbToHex(value);
                    }else if(key == "background-color"){
                        color.bgColor = rgbToHex(value);
                    }
                });

                return color;
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

                $eaemFontPicker = $modal;

                $eaemFontPicker.eaemFontPlugin = self;

                $modal.nextAll(".coral-Modal-backdrop").addClass("cfm-coral2-backdrop");
            },

            getPickerIFrameUrl: function(size, color, bgColor){
                var url = Granite.HTTP.externalize(FONT_SELECTOR_URL) + "?" + REQUESTER + "=" + SENDER;

                if(!_.isEmpty(color)){
                    url = url + "&color=" + encodeURIComponent(color);
                }

                if(!_.isEmpty(bgColor)){
                    url = url + "&bgColor=" + encodeURIComponent(bgColor);
                }

                if(!_.isEmpty(size)){
                    url = url + "&size=" + size;
                }

                return url;
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