(function ($, $document, Handlebars) {
    var ExperienceAEM = {
        GROUP: "experience-aem",
        TIM_FEATURE: "touchuiinsertimage",
        TIM_DIALOG: "touchuiinsertimagedialog",
        CONTENT_URL: "/apps/touchui-rte-browse-insert-image/popover.html",
        EAEM_RTE_IFRAME_CONTENT: "eaem-rte-iframe-content"
    };

    ExperienceAEM.TIM_UI_SETTING = ExperienceAEM.GROUP + "#" + ExperienceAEM.TIM_FEATURE;

    //extend toolbar builder to register insert image
    ExperienceAEM.CuiToolbarBuilder = new Class({
        toString: "EAEMCuiToolbarBuilder",

        extend: CUI.rte.ui.cui.CuiToolbarBuilder,

        _getUISettings: function (options) {
            var uiSettings = this.superClass._getUISettings(options);

            //inline toolbar
            var toolbar = uiSettings["inline"]["toolbar"],
                feature = ExperienceAEM.TIM_UI_SETTING;

            //uncomment this to make image insert available for inline toolbar
            /*if (toolbar.indexOf(feature) == -1) {
                var index = toolbar.indexOf("fullscreen#start");
                toolbar.splice(index, 0, feature);
                toolbar.splice(index + 1, 0, "-");
            }*/

            //add image insert to fullscreen toolbar
            toolbar = uiSettings["fullscreen"]["toolbar"];

            if (toolbar.indexOf(feature) == -1) {
                toolbar.splice(3, 0, feature);
            }

            if (!this._getClassesForCommand(feature)) {
                this.registerAdditionalClasses(feature, "coral-Icon coral-Icon--image");
            }

            return uiSettings;
        }
    });

    //popover dialog thats hosts iframe
    ExperienceAEM.InsertImageDialog = new Class({
        extend: CUI.rte.ui.cui.AbstractBaseDialog,

        toString: "EAEMInsertImageDialog",

        getDataType: function () {
            return ExperienceAEM.TIM_DIALOG;
        }
    });

    //extend the CUI dialog manager to register popover dialog
    ExperienceAEM.DialogManager = new Class({
        toString: "EAEMDialogManager",

        extend: CUI.rte.ui.cui.CuiDialogManager,

        create: function (dialogId, config) {
            if (dialogId !== ExperienceAEM.TIM_DIALOG) {
                return this.superClass.create.call(this, dialogId, config);
            }

            var context = this.editorKernel.getEditContext();
            var $container = CUI.rte.UIUtils.getUIContainer($(context.root));

            var dialog = new ExperienceAEM.InsertImageDialog();
            dialog.attach(config, $container, this.editorKernel, true);

            return dialog;
        }
    });

    //extend the toolkit implementation for returning custom toolbar builder and dialog manager
    ExperienceAEM.ToolkitImpl = new Class({
        toString: "EAEMToolkitImpl",

        extend: CUI.rte.ui.cui.ToolkitImpl,

        createToolbarBuilder: function () {
            return new ExperienceAEM.CuiToolbarBuilder();
        },

        createDialogManager: function (editorKernel) {
            return new ExperienceAEM.DialogManager(editorKernel);
        }
    });

    CUI.rte.ui.ToolkitRegistry.register("cui", ExperienceAEM.ToolkitImpl);

    ExperienceAEM.TouchUIInsertImagePlugin = new Class({
        toString: "TouchUIInsertImagePlugin",

        extend: CUI.rte.plugins.Plugin,

        pickerUI: null,

        getFeatures: function () {
            return [ ExperienceAEM.TIM_FEATURE ];
        },

        initializeUI: function (tbGenerator) {
            var plg = CUI.rte.plugins;

            if (this.isFeatureEnabled(ExperienceAEM.TIM_FEATURE)) {
                this.pickerUI = tbGenerator.createElement(ExperienceAEM.TIM_FEATURE, this, true, "Insert Image");
                tbGenerator.addElement(ExperienceAEM.GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 120);
            }
        },

        execute: function (id) {
            var ek = this.editorKernel,
                dm = ek.getDialogManager();

            var dialogConfig = {
                parameters: {
                    "command": ExperienceAEM.TIM_UI_SETTING
                }
            };

            var dialog = this.dialog = dm.create(ExperienceAEM.TIM_DIALOG, dialogConfig);

            dm.prepareShow(this.dialog);

            dm.show(this.dialog);

            var $popover = this.dialog.$dialog.find(".coral-Popover-content");

            loadPopoverUI($popover);

            function loadPopoverUI($popover) {
                $popover.parent().css("width", ".1px").height(".1px").css("border", "none");
                $popover.css("width", ".1px").height(".1px");

                $popover.find("iframe").attr("src", ExperienceAEM.CONTENT_URL);

                //receive the dialog values from child window
                registerReceiveDataListener(receiveMessage);
            }

            function receiveMessage(event) {
                if (_.isEmpty(event.data)) {
                    return;
                }

                var message = JSON.parse(event.data);

                if(!message || message.sender != ExperienceAEM.EAEM_RTE_IFRAME_CONTENT){
                    return;
                }

                var action = message.action;

                if(action == "submit"){
                    var data = message.data;

                    if(!_.isEmpty(data) && !_.isEmpty(data.imagePath)){
                        ek.relayCmd(id, message.data);
                    }
                }

                dialog.hide();

                removeReceiveDataListener(receiveMessage);
            }

            function removeReceiveDataListener(handler){
                if (window.removeEventListener) {
                    window.removeEventListener("message",  handler);
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
        },

        //to mark the icon selected/deselected
        updateState: function (selDef) {
            var hasUC = this.editorKernel.queryState(ExperienceAEM.TIM_FEATURE, selDef);

            if (this.pickerUI != null) {
                this.pickerUI.setSelected(hasUC);
            }
        }
    });

    CUI.rte.plugins.PluginRegistry.register(ExperienceAEM.GROUP, ExperienceAEM.TouchUIInsertImagePlugin);

    ExperienceAEM.InsertImageCmd = new Class({
        toString: "InsertImageCmd",

        extend: CUI.rte.commands.Command,

        isCommand: function (cmdStr) {
            return (cmdStr.toLowerCase() == ExperienceAEM.TIM_FEATURE);
        },

        getProcessingOptions: function () {
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION;
        },

        execute: function (execDef) {
            var data = execDef.value, path = data.imagePath, alt = data.altText || "",
                width = 100, height = 100,
                imageUrl = CUI.rte.Utils.processUrl(path, CUI.rte.Utils.URL_IMAGE),
                imgHtml = "";

            imgHtml += "<img src=\"" + imageUrl + "\" alt=\"" + alt + "\"";
            imgHtml += " " + CUI.rte.Common.SRC_ATTRIB + "=\"" + path + "\"";
            imgHtml += " width=\"" + width + "\"";
            imgHtml += " height=\"" + height + "\"";
            imgHtml += ">";

            execDef.editContext.doc.execCommand("insertHTML", false, imgHtml);
        }
    });

    CUI.rte.commands.CommandRegistry.register(ExperienceAEM.GROUP, ExperienceAEM.InsertImageCmd);

    //returns the picker dialog html
    //Handlebars doesn't do anything useful here, but the framework expects a template
    function cpTemplate() {
        CUI.rte.Templates["dlg-" + ExperienceAEM.TIM_DIALOG] =
            Handlebars.compile('<div data-rte-dialog="' + ExperienceAEM.TIM_DIALOG
                + '" class="coral--dark coral-Popover coral-RichText-dialog">'
                + '<iframe width="1100px" height="700px"></iframe>'
                + '</div>');
    }

    cpTemplate();
})(jQuery, jQuery(document), Handlebars);