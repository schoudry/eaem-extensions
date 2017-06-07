(function(){
    //the original create page dialog fn
    var cqCreatePageDialog = CQ.wcm.Page.getCreatePageDialog;
 
    //override ootb function
    CQ.wcm.Page.getCreatePageDialog = function(parentPath){
        //create dialog by executing the product function
        var dialog = cqCreatePageDialog(parentPath);

        try{
            //disable create until page title gets validated
            var createButton = dialog.buttons[0];
            createButton.setDisabled(true);

            //make necessary UI changes to the dialog created above
            var panel = dialog.findBy(function(comp){
                return comp["jcr:primaryType"] == "cq:Panel";
            }, dialog);

            if(!panel || !panel.length){
                return;
            }

            panel = panel[0];

            //get title field
            var titleField = panel.findBy(function(comp){
                return comp["fieldLabel"] == "Title";
            }, panel);

            if(!titleField || !titleField.length){
                return;
            }

            titleField = titleField[0];

            titleField.on('change', function(t, nvalue){
                //when user enters title, search CRX if a title with same wording exists
                $.ajax({
                    type: "GET",
                    url: "/bin/querybuilder.json",
                    data: {
                        "path": parentPath,
                        "0_property": "jcr:title",
                        "0_property.value": nvalue
                    }
                }).done(function(data){
                    if(data && data.hits && data.hits.length > 0){
                        CQ.Ext.Msg.alert("Error", "Page " + nvalue + " exists in path " + parentPath);
                        return;
                    }

                    //not a duplicate, enable create button
                    createButton.setDisabled(false);
                })
            })
        }catch(err){
            console.log("Error executing CQ.wcm.Page.getCreatePageDialog override");
        }

        return dialog;
    }
})();