(function(){
    if( ( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)){
        CQ.WCM.on("editablesready", function(){
            CQ.WCM.getSidekick().hide();
        });
    }
})();