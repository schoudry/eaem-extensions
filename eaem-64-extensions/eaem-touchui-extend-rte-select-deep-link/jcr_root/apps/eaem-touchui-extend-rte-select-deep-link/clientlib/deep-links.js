(function ($) {
    "use strict";

    var _ = window._,
        Class = window.Class,
        CUI = window.CUI,
        EAEM_ANCHOR_SELECT = "eaem-anchor-select",
        RTE_LINK_DIALOG = "rtelinkdialog";

    if(CUI.rte.ui.cui.CuiDialogHelper.eaemExtended){
        return;
    }

    var EAEMLinkBaseDialog = new Class({
        extend: CUI.rte.ui.cui.CQLinkBaseDialog,

        toString: "EAEMLinkBaseDialog",

        initialize: function(config) {
            this.superClass.initialize.call(this, config);

            this.$rteDialog = this.$container.find("[data-rte-dialog=link]");

            var $path = this.$rteDialog.find(".rte-dialog-columnContainer:first");

            $(getAnchorsSelect()).insertAfter($path);

            function getAnchorsSelect(){
                var html = '<div class="rte-dialog-columnContainer">' +
                                '<div class="rte-dialog-column">' +
                                    '<coral-select disabled="disabled" class="coral-Form-field" placeholder="Select Link" id="' + EAEM_ANCHOR_SELECT + '">' +
                                    '</coral-select>' +
                                '</div>' +
                           '</div>';

                return html;
            }
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

    CUI.rte.ui.cui.CuiDialogHelper.eaemExtended = true;
})(jQuery);
