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

            var baseDialog = this;

            this.$rteDialog = this.$container.find("[data-rte-dialog=link]");

            var $path = this.$rteDialog.find(".rte-dialog-columnContainer:first");

            $(baseDialog.getAnchorsSelect()).insertAfter($path);

            $path.find("foundation-autocomplete").on("foundation-field-change", constructSelect);

            function constructSelect() {
                var pathField = $(this).adaptTo('foundation-field');

                $.get(pathField.getValue() + ".html?wcmmode=disabled").done(successFn);

                function successFn(respHtml){
                    var $aTags = $(respHtml).find("a"), options = [];

                    $aTags.each(function( i, aTag ) {
                        if(_.isEmpty(aTag.name)){
                            return;
                        }

                        options.push(aTag.name);
                    });

                    $(baseDialog.getAnchorsSelect(options)).insertAfter($path);
                }
            }
        },

        getAnchorsSelect: function(options, dValue){
            $("#" + EAEM_ANCHOR_SELECT).remove();

            var html = '<div class="rte-dialog-columnContainer" id="' + EAEM_ANCHOR_SELECT + '">' +
                            '<div class="rte-dialog-column">' +
                                '<coral-select class="coral-Form-field" placeholder="Select Link">';

            _.each(options, function(option){
                html = html + '<coral-select-item value="' + option + '"'
                            + ( (dValue == option) ? " selected " : "" ) + '>' + option + '</coral-select-item>';
            });

            html = html + '</coral-select></div></div>';

            return html;
        },

        dlgFromModel: function() {
            if (_.isEmpty(this.objToEdit) || _.isEmpty(this.objToEdit.href)
                        || (this.objToEdit.href.indexOf("#") == -1)) {
                this.superClass.dlgFromModel.call(this);
                return;
            }

            var href = this.objToEdit.href, anchor,
                $path = this.$rteDialog.find(".rte-dialog-columnContainer:first");

            this.objToEdit.href = href.substring(0, href.lastIndexOf("#"));

            this.superClass.dlgFromModel.call(this);

            anchor = href.substring(href.lastIndexOf("#") + 1);

            $.get(href + ".html?wcmmode=disabled").done($.proxy(successFn, this));

            function successFn(respHtml){
                var $aTags = $(respHtml).find("a"), options = [];

                $aTags.each(function( i, aTag ) {
                    if(_.isEmpty(aTag.name)){
                        return;
                    }

                    options.push(aTag.name);
                });

                $(this.getAnchorsSelect(options, anchor)).insertAfter($path);
            }
        },

        dlgToModel: function() {
            this.superClass.dlgToModel.call(this);

            var anchorSelect = this.$dialog.find("#" + EAEM_ANCHOR_SELECT + " >* coral-select");

            if(_.isEmpty(anchorSelect)){
                return;
            }

            var aVal = anchorSelect.val();

            if (_.isEmpty(aVal)) {
                return;
            }

            this.objToEdit.href = this.objToEdit.href + "#" + aVal;
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
