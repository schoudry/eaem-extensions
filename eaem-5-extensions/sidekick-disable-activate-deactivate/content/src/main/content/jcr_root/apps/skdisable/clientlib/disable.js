(function(){
    if( ( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)){
        var SK_INTERVAL = setInterval(function(){
            var sk = CQ.WCM.getSidekick();

            if(sk && sk.panels){
                clearInterval(SK_INTERVAL);

                $.ajax({
                    url: '/bin/experienceaem/getgroups',
                    dataType: "json",
                    type: 'GET',
                    async: false,
                    success: function(data){
                        data = data[CQ.User.getCurrentUser().getUserID()];

                        if(data.indexOf("administrators") !== -1){
                            return;
                        }
                        var pagePanel = sk.panels["PAGE"];

                        var buttons = pagePanel.findBy(function(comp){
                            return comp["name"] == "PUBLISH" || comp["name"] == "DEACTIVATE";
                        }, pagePanel);

                        CQ.Ext.each(buttons, function(button){
                            button.setDisabled(true);
                        });
                    }
                });
            }
        }, 250);
    }
})();