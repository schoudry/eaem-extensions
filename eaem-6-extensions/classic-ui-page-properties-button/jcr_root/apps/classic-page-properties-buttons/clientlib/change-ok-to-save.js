(function(){
    if( ( window.location.pathname !== "/cf" ) && ( window.location.pathname.indexOf("/content") !== 0)){
        return;
    }

    var SK_INTERVAL = setInterval(function(){
        var sk = CQ.WCM.getSidekick();

        if(sk){
            clearInterval(SK_INTERVAL);

            var dialog = CQ.WCM.getDialog(sk.initialConfig.propsDialog);

            if(dialog){
                dialog.success = function(form, action) {
                    CQ.Util.reload(CQ.WCM.getContentWindow());
                };

                var okButton = dialog.buttons[0];

                okButton.setText("Save");
            }
        }
    }, 250);
})();