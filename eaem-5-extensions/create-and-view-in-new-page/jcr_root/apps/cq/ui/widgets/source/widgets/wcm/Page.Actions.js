$.getScript("/libs/cq/ui/widgets/source/widgets/wcm/Page.Actions.js", function(){
    var cqCreatePageDialog = CQ.wcm.Page.getCreatePageDialog;

    CQ.wcm.Page.getCreatePageDialog = function(parentPath){
        var dialog = cqCreatePageDialog(parentPath);

        var panel = dialog.findBy(function(comp){
            return comp["jcr:primaryType"] == "cq:Panel";
        }, dialog);

        if(panel && panel.length > 0){
            var pathField = {
                "xtype": "pathfield",
                fieldLabel: "Select Path",
                style: "margin-bottom: 5px;",
                "width": "100%",
                rootPath: "/content",
                listeners: {
                    dialogclose: {
                        fn: function(){
                            var parentPath = dialog.formPanel.findBy(function(comp){
                                return comp["name"] == "parentPath";
                            }, dialog);

                            parentPath[0].setValue(this.getValue());

                            var dView = dialog.findBy(function(comp){
                                return comp["itemSelector"] == "div.template-item";
                            }, dialog);

                            dView[0].store.baseParams.path = this.getValue();
                            dView[0].store.reload();
                        }
                    }
                }
            };

            panel[0].insert(2,pathField);
            panel[0].doLayout();
        }

        dialog.buttons.splice(0,0,new CQ.Ext.Button( {
                text: "Create & View",
                width: 120,
                tooltip: 'Create page and preview',
                handler: function(button){
                    dialog.ok(button, function(form, resp){
                        try{
                            var text = resp.response.responseText;
                            var loc = text.substring(text.indexOf("\"", text.indexOf("href=")) + 1);

                            loc = "/cf#" + loc.substr(0, loc.indexOf("\"")) + ".html";
                            window.location = loc;
                        }catch(err){
                            console.log("page create and view - error parsing html response");
                        }
                    });
                }}
        ));

        return dialog;
    }
});