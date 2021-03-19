(function($, CUI, $document){
    var GROUP = "eaem-aem-fonts",
        FONT_FEATURE = "applyFont",
        TEXT_COLOR_FEATURE = "textColor",
        TEXT_BG_COLOR_FEATURE = "textBackgroundColor",
        EAEM_APPLY_FONT_DIALOG = "eaemTouchUIApplyFontDialog",
        SENDER = "eaem-aem", REQUESTER = "requester", $eaemFontPicker,
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        FONT_SELECTOR_URL = "/apps/eaem-cs-rte-plugin-color-picker/clientlibs/fonts-plugin/font-selector.html",
        MOBILE_HIDE_CONTENT_CLASS = "eaem--content-mobile-hide",
        DESKTOP_HIDE_CONTENT_CLASS = "eaem--content-desktop-hide",
        TABLET_HIDE_CONTENT_CLASS = "eaem--content-tablet-hide",
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

    function setWidgetValue(form, selector, value, enable){
        Coral.commons.ready(form.querySelector(selector), function (field) {
            if(field.tagName == "CORAL-CHECKBOX"){
                if(value == "true"){
                    field.checked = true;
                }
            }else{
                field.value = _.isEmpty(value) ? "" : decodeURIComponent(value);
            }

            if(enable){
                delete field.disabled;
            }else{
                field.disabled = "disabled";
            }
        });
    }

    function fillDefaultValues(){
        var queryParams = queryParameters(),
            $form = $("form");

        if(_.isEmpty(queryParams.features)){
            return;
        }

        var features = queryParams.features.split(",");

        setWidgetValue($form[0], "[name='./style']", queryParams.class, true);

        setWidgetValue($form[0], "[name='./hideOnMobile']", queryParams.hideOnMobile, true);

        setWidgetValue($form[0], "[name='./hideOnTablet']", queryParams.hideOnTablet, true);

        setWidgetValue($form[0], "[name='./hideOnDesktop']", queryParams.hideOnDesktop, true);

        setWidgetValue($form[0], "[name='./color']", queryParams.color, features.includes(TEXT_COLOR_FEATURE));

        setWidgetValue($form[0], "[name='./bgColor']", queryParams.bgColor, features.includes(TEXT_BG_COLOR_FEATURE));

        $form.css("background-color", "#fff");
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

        addCheckboxValue(message, $form, "./hideOnDesktop");

        addCheckboxValue(message, $form, "./hideOnTablet");

        addCheckboxValue(message, $form, "./hideOnMobile");

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function addCheckboxValue(message, $form, cbName){
        var $checkbox = $form.find("coral-checkbox[name='" + cbName + "']");

        if(!_.isEmpty($checkbox)){
            message.data[$checkbox.attr("name").substr(2)] = $checkbox[0].checked;
        }
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

    addPlugin();

    addPluginToDefaultUISettings();

    addDialogTemplate();

    function addDialogTemplate(){
        var url = Granite.HTTP.externalize(FONT_SELECTOR_URL) + "?" + REQUESTER + "=" + SENDER;

        var html = "<iframe width='600px' height='450px' frameBorder='0' src='" + url + "'></iframe>";

        if(_.isUndefined(CUI.rte.Templates)){
            CUI.rte.Templates = {};
        }

        if(_.isUndefined(CUI.rte.templates)){
            CUI.rte.templates = {};
        }

        try{
            CUI.rte.templates['dlg-' + EAEM_APPLY_FONT_DIALOG] = CUI.rte.Templates['dlg-' + EAEM_APPLY_FONT_DIALOG] = Handlebars.compile(html);
        }catch(err){
            console.log("Ignoring font plugin error", err);
        }
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
            toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.dialogFullScreen.toolbar;

        if(toolbar.includes(groupFeature)){
            return;
        }

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
        var EAEMTouchUIFontPlugin = new Class({
            toString: "EAEMTouchUIFontPlugin",

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
                tbGenerator.registerIcon(groupFeature, "colorPalette");
            },

            notifyPluginConfig: function (pluginConfig) {
                pluginConfig = pluginConfig || {};

                CUI.rte.Utils.applyDefaults(pluginConfig, {
                    'tooltips': {
                        applyFont: {
                            'title': 'Apply Font',
                            'text': 'Apply Font to selected text'
                        }
                    }
                });

                this.config = pluginConfig;
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
                    clazz = $tag.attr("class"), hideOnMobile = false, hideOnDesktop = false, hideOnTablet = false,
                    size = $tag.css("font-size"),dialog,dm = ek.getDialogManager(),
                    $container = CUI.rte.UIUtils.getUIContainer($(context.root)),
                    propConfig = {
                        'parameters': {
                            'command': this.pluginId + '#' + FONT_FEATURE
                        }
                    };

                if(clazz && clazz.includes(MOBILE_HIDE_CONTENT_CLASS)){
                    hideOnMobile = true;
                    clazz = clazz.replace(MOBILE_HIDE_CONTENT_CLASS, "").trim();
                }

                if(clazz && clazz.includes(TABLET_HIDE_CONTENT_CLASS)){
                    hideOnTablet = true;
                    clazz = clazz.replace(TABLET_HIDE_CONTENT_CLASS, "").trim();
                }

                if(clazz && clazz.includes(DESKTOP_HIDE_CONTENT_CLASS)){
                    hideOnDesktop = true;
                    clazz = clazz.replace(DESKTOP_HIDE_CONTENT_CLASS, "").trim();
                }

                var color = this.getColorAttributes($tag);

                if(this.eaemApplyFontDialog){
                    dialog = this.eaemApplyFontDialog;

                    dialog.$dialog.find("iframe").attr("src", this.getPickerIFrameUrl(this.config.features, size, clazz,
                        hideOnMobile, hideOnTablet, hideOnDesktop, color.color, color.bgColor));
                }else{
                    dialog = new EAEMApplyFontDialog();

                    dialog.attach(propConfig, $container, this.editorKernel);

                    dialog.$dialog.css("-webkit-transform", "scale(0.9)").css("-webkit-transform-origin", "0 0")
                        .css("-moz-transform", "scale(0.9)").css("-moz-transform-origin", "0px 0px");

                    dialog.$dialog.find("iframe").attr("src",
                        this.getPickerIFrameUrl(this.config.features, size, clazz, hideOnMobile, hideOnTablet, hideOnDesktop, color.color, color.bgColor));

                    this.eaemApplyFontDialog = dialog;
                }

                dm.show(dialog);

                $(window).off('message', receiveMessage).on('message', receiveMessage);

                function isValidSelection(){
                    var winSel = window.getSelection();
                    return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
                }

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

            getPickerIFrameUrl: function(features, size, clazz, hideOnMobile, hideOnTablet, hideOnDesktop, color, bgColor){
                var url = Granite.HTTP.externalize(FONT_SELECTOR_URL) + "?" + REQUESTER + "=" + SENDER;

                if(features === "*"){
                    features = [TEXT_COLOR_FEATURE , TEXT_BG_COLOR_FEATURE];
                }

                url = url + "&features=" + features.join(",");

                if(!_.isEmpty(color)){
                    url = url + "&color=" + encodeURIComponent(color);
                }

                if(!_.isEmpty(bgColor)){
                    url = url + "&bgColor=" + encodeURIComponent(bgColor);
                }

                if(!_.isEmpty(size)){
                    url = url + "&size=" + size;
                }

                if(!_.isEmpty(clazz)){
                    url = url + "&class=" + clazz;
                }

                if(hideOnMobile){
                    url = url + "&hideOnMobile=" + hideOnMobile;
                }

                if(hideOnTablet){
                    url = url + "&hideOnTablet=" + hideOnTablet;
                }

                if(hideOnDesktop){
                    url = url + "&hideOnDesktop=" + hideOnDesktop;
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

        var EAEMTouchUIFontCmd = new Class({
            toString: "EAEMTouchUIFontCmd",

            extend: CUI.rte.commands.Command,

            isCommand: function (cmdStr) {
                return (cmdStr.toLowerCase() == FONT_FEATURE);
            },

            getProcessingOptions: function () {
                var cmd = CUI.rte.commands.Command;
                return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
            },

            getTagObject: function(textData) {
                var style = "";

                if(!_.isEmpty(textData.color)){
                    style = "color: " + textData.color + ";";
                }

                if(!_.isEmpty(textData.size)){
                    style = style + "font-size: " + textData.size + ";";
                }

                if(!_.isEmpty(textData.bgColor)){
                    style = style + "background-color: " + textData.bgColor;
                }

                var spanTag = {
                    "tag": "span",
                    "attributes": {
                        "style" : style
                    }
                };

                var clazz = textData.style;

                if(!_.isEmpty(clazz)){
                    spanTag.attributes.class = clazz;
                }

                if(textData.hideOnMobile){
                    addClazz(spanTag, MOBILE_HIDE_CONTENT_CLASS);
                }

                if(textData.hideOnTablet){
                    addClazz(spanTag, TABLET_HIDE_CONTENT_CLASS);
                }

                if(textData.hideOnDesktop){
                    addClazz(spanTag, DESKTOP_HIDE_CONTENT_CLASS);
                }

                return spanTag;

                function addClazz(tag, tagClazz){
                    tag.attributes.class = tag.attributes.class ? (tag.attributes.class + " ") : "";
                    tag.attributes.class = tag.attributes.class + tagClazz;
                }
            },

            execute: function (execDef) {
                var textData = execDef.value, selection = execDef.selection,
                    nodeList = execDef.nodeList;

                if (!selection || !nodeList) {
                    return;
                }

                var common = CUI.rte.Common,
                    context = execDef.editContext,
                    tagObj = this.getTagObject(textData);

                if(_.isEmpty(textData.size) && _.isEmpty(textData.color)
                            && _.isEmpty(textData.bgColor) && _.isEmpty(textData.style)
                            && !textData.hideOnMobile && !textData.hideOnDesktop && !textData.hideOnTablet){
                    nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, undefined, true);
                    return;
                }

                var tags = common.getTagInPath(context, selection.startNode, tagObj.tag);

                //remove existing color before adding new color
                if (tags != null) {
                    nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, tags.attributes ? tags.attributes : undefined, true);
                }

                nodeList.surround(execDef.editContext, tagObj.tag, tagObj.attributes);
            },

            queryState: function(selectionDef, cmd) {
                return false;
            }
        });

        CUI.rte.commands.CommandRegistry.register(FONT_FEATURE, EAEMTouchUIFontCmd);

        CUI.rte.plugins.PluginRegistry.register(GROUP,EAEMTouchUIFontPlugin);
    }
}(jQuery, window.CUI,jQuery(document)));