(function(){
    var cqCreatePageDialog = CQ.wcm.Page.getCreatePageDialog;

    CQ.wcm.Page.getCreatePageDialog = function(parentPath){
        var dialog = cqCreatePageDialog(parentPath);

        var panel = dialog.findBy(function(comp){
            return comp["jcr:primaryType"] == "cq:Panel";
        }, dialog);

        if(!panel || panel.length == 0){
            return;
        }

        dialog.buttons.splice(0,0,new CQ.Ext.Button( {
                text: "Scaffolding View",
                width: 140,
                tooltip: 'Create page and open in scaffolding view',
                handler: function(button){
                    dialog.ok(button, function(form, resp){
                        try{
                            var text = resp.response.responseText;
                            var loc = text.substring(text.indexOf("\"", text.indexOf("href=")) + 1);

                            loc = "/cf#" + loc.substr(0, loc.indexOf("\"")) + ".scaffolding.html";
                            window.location = loc;
                        }catch(err){
                            console.log("page create and scaffolding view - error parsing html response");
                        }
                    });
                }}
        ));

        return dialog;
    }
})();