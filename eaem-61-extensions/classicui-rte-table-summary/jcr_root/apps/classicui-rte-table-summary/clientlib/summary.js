CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.ToolkitImpl = new Class({
    toString: "EAEMToolkitImpl",

    extend: CUI.rte.ui.ext.ToolkitImpl,

    //extend the dialog manager
    createDialogManager: function(editorKernel) {
        return new ExperienceAEM.ExtDialogManager(editorKernel);
    }
});

CUI.rte.ui.ToolkitRegistry.register("ext", ExperienceAEM.ToolkitImpl);

ExperienceAEM.ExtDialogManager = new Class({
    toString: "EAEMExtDialogManager",

    extend: CUI.rte.ui.ext.ExtDialogManager,

    //add the summary widget to table properties dialog
    createTablePropsDialog: function(cfg) {
        var dialog = this.superClass.createTablePropsDialog.call(this, cfg);

        var fields = dialog.findByType("form")[0];

        fields.add({
            "itemId": "summary",
            "name": "summary",
            "xtype": "textarea",
            "width": 170,
            "fieldLabel": "Summary"
        });

        dialog.setHeight(400);

        return dialog;
    }
});

ExperienceAEM.Table = new Class({
    toString: "EAEMTable",

    extend: CUI.rte.commands.Table,

    //add/remove the summary
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

CUI.rte.commands.CommandRegistry.register("_table", ExperienceAEM.Table);


