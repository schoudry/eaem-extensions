(function ($) {
    "use strict";

    var _ = window._,
        Class = window.Class,
        CUI = window.CUI,
        REL_FIELD = "rel",
        RTE_LINK_DIALOG = "rtelinkdialog";

    if(CUI.rte.ui.cui.CuiDialogHelper.eaemExtended){
        return;
    }

    var EAEMLinkBaseDialog = new Class({
        extend: CUI.rte.ui.cui.LinkBaseDialog,

        toString: "EAEMLinkBaseDialog",

        initialize: function(config) {
            this.superClass.initialize.call(this, config);

            this.$rteDialog = this.$container.find("[data-rte-dialog=link]");

            this.$rteDialog.find(".coral-Popover-content").append(getLinkRelOptionsHtml());
        },

        dlgToModel: function() {
            this.superClass.dlgToModel.call(this);

            var relField = this.getFieldByType(REL_FIELD);

            if(_.isEmpty(relField)){
                return;
            }

            var relVal = relField.val();

            if (_.isEmpty(relVal)) {
                return;
            }

            this.objToEdit.attributes["rel"] = relVal;
        }
    });

    CUI.rte.ui.cui.CuiDialogHelper = new Class({
        extend: CUI.rte.ui.cui.CuiDialogHelper,

        toString: "EAEMCuiDialogHelper",

        instantiateDialog: function(dialogConfig) {
            var type = dialogConfig.type;

            if(type !== RTE_LINK_DIALOG){
                this.superClass.instantiateDialog.call(this, dialogConfig);
                return;
            }

            var $editable = $(this.editorKernel.getEditContext().root),
                $container = CUI.rte.UIUtils.getUIContainer($editable),
                dialog = new EAEMLinkBaseDialog();

            dialog.attach(dialogConfig, $container, this.editorKernel);

            return dialog;
        }
    });

    function getLinkRelOptionsHtml(){
        var html =  "<div class='coral-RichText-dialog-columnContainer'>" +
                    "<div class='coral-RichText-dialog-column'>" +
                    "<coral-select data-type='rel' placeholder='Choose \"rel\" attribute'>";

        var options = ["alternate", "author", "bookmark", "external", "help",
                        "license", "next", "nofollow", "noreferrer", "noopener", "prev", "search", "tag" ];

        _.each(options, function(option){
            html = html + getOptionHtml(option);
        });

        html = html + "</coral-select></div></div>";

        return html;

        function getOptionHtml(option){
            return "<coral-select-item>" + option + "</coral-select-item>"
        }
    }

    CUI.rte.ui.cui.CuiDialogHelper.eaemExtended = true;
})(jQuery);
