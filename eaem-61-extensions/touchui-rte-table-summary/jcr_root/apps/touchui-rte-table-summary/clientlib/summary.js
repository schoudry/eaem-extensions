(function ($) {
    "use strict";

    var _ = window._,
        Class = window.Class,
        CUI = window.CUI,
        EAEM_TABLE = null,
        COLUMN_CONTAINER = ".coral-RichText-dialog-columnContainer",
        SUMMARY_SEL = ".coral-RichText-dialog--tableprops textarea[data-type=\"summary\"]",
        SUMMARY_HTML = '<div class="coral-RichText-dialog-columnContainer">'
                            + '<div class="coral-RichText-dialog-column">'
                                +  'Summary'
                            +  '</div>'
                            +  '<div class="coral-RichText-dialog-column">'
                                +  '<textarea data-type="summary" class="coral-Textfield coral-Textfield--multiline coral-RichText--large"></textarea>'
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

            this.$caption = this.$container.find(".coral-RichText-dialog--tableprops input[data-type=\"caption\"]");

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