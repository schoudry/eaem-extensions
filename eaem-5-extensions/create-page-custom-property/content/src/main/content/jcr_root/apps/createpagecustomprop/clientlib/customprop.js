(function(){
    //the original create page dialog fn
    var cqCreatePageDialog = CQ.wcm.Page.getCreatePageDialog;

    //override ootb function and add description field
    CQ.wcm.Page.getCreatePageDialog = function(parentPath){
        //create dialog by executing the product function
        var dialog = cqCreatePageDialog(parentPath);

        //make necessary UI changes to the dialog created above
        var panel = dialog.findBy(function(comp){
            return comp["jcr:primaryType"] == "cq:Panel";
        }, dialog);

        if(panel && panel.length > 0){
            var description = new CQ.Ext.form.TextArea({
                "fieldLabel": "Description",
                "name": "pageDescription"
            });

            panel[0].insert(2,description);
            panel[0].doLayout();

            dialog.params.cmd = "createPageWithDescription";

            var cmdField = dialog.formPanel.findBy(function(comp){
                return comp["name"] == "cmd";
            }, dialog.formPanel);

            cmdField[0].setValue("createPageWithDescription");
        }
        return dialog;
    }
})();