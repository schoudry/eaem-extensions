(function(){
    if( ( window.location.pathname !== "/cf" ) && ( window.location.pathname.indexOf("/content") !== 0)){
        return;
    }
 
    var SK_INTERVAL = setInterval(function(){
        var sk = CQ.WCM.getSidekick();
 
        if(!sk){
            return;
        }

        clearInterval(SK_INTERVAL);

        try{
            var dialog = CQ.WCM.getDialog(sk.initialConfig.propsDialog);

            if(!dialog){
                return;
            }

            dialog.addButton(new CQ.Ext.Button({
                "text":"Help",
                "tooltip":{
                    "title":"Help",
                    "text":"Open help page in new tab",
                    "autoHide":true
                },
                handler : function(){
                    CQ.Ext.Msg.alert("Help", "Click ok to open helpx.adobe.com in new tab", function(){
                            var win = window.open("http://helpx.adobe.com", '_blank');
                            win.focus();
                        }
                    );
                }
            }));

            dialog.buttons.unshift(dialog.buttons.pop());

            dialog.doLayout();
        }catch(err){
            console.log("Error executing extension")
        }
    }, 250);
})();