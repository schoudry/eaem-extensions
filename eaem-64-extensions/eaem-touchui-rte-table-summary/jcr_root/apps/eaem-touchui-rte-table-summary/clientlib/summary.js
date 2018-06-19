(function ($) {
    "use strict";

    var _ = window._,
        Class = window.Class,
        CUI = window.CUI,
        EAEM_TABLE = null,
        COLUMN_CONTAINER = ".rte-dialog-columnContainer",
        SUMMARY_SEL = ".rte-dialog--tableprops input[data-type=\"summary\"]",
        SUMMARY_HTML = '<div class="rte-dialog-columnContainer">'
            + '<div class="rte-dialog-column">'
            +  'Summary'
            +  '</div>'
            +  '<div class="rte-dialog-column">'
            +  '<input is="coral-textfield" class="coral3-Textfield rte--large" data-type="summary">'
            +  '</div>'
            + '</div>';

    if(CUI.rte.ui.cui.TablePropsDialog.eaemExtended){
        return;
    }

    CUI.rte.ui.cui.TablePropsDialog = new Class({

        extend: CUI.rte.ui.cui.TablePropsDialog,

        toString: "EAEMTablePropsDialog",

        initialize: function(config) {
            this.superClass.initialize.call(this, config);

            this.$summary = this.$container.find(SUMMARY_SEL);

            if(!_.isEmpty(this.$summary)){
                return;
            }

            this.$caption = this.$container.find(".rte-dialog--tableprops input[data-type=\"caption\"]");

            $(SUMMARY_HTML).insertBefore( this.$caption.closest(COLUMN_CONTAINER) );

            this.$summary = this.$container.find(SUMMARY_SEL);

            this.propertyItems.push(this.$summary);
        }
    });

    EAEM_TABLE = new Class({
        toString: "EAEMTable",

        extend: CUI.rte.commands.Table,

        transferConfigToTable: function(dom, execDef) {
            this.superClass.transferConfigToTable.call(this, dom, execDef);

            var com = CUI.rte.Common,
                config = execDef.value;

            if (config.summary) {
                com.setAttribute(dom, "summary", config.summary);
            } else {
                com.removeAttribute(dom, "summary");
            }
        }
    });

    CUI.rte.commands.CommandRegistry.register("_table", EAEM_TABLE);

    CUI.rte.ui.cui.TablePropsDialog.eaemExtended = true;
})(jQuery);