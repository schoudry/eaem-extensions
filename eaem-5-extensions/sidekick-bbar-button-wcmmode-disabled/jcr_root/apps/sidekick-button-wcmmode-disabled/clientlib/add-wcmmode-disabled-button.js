CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.Sidekick = {
    WCMMODE_DISABLED_BUTTON_ID: "experience-aem-sk-button-wcmmode-disabled",

    //add the button to sidekick bottom bar
    addWCMModeDisabled: function(sk){
        var bbar = sk.getBottomToolbar();
        var dButton = bbar.getComponent(0);

        //if the sidekick is reloaded, remove existing and add a fresh one
        if(dButton.getId() == this.WCMMODE_DISABLED_BUTTON_ID){
            bbar.remove(dButton, true);
        }

        dButton = new CQ.Ext.Button({
            id: this.WCMMODE_DISABLED_BUTTON_ID,
            iconCls: "cq-sidekick-wcmmode-disabled",
            tooltip: {
                title: "Disabled",
                text: "Switch to wcmmode=disabled"
            },
            handler: function() {
                var win = CQ.WCM.isContentWindow(window) ?  window.parent : window;
                win.location.href = sk.getPath() + ".html?wcmmode=disabled";
            },
            scope: sk
        });

        //add the button as first component in bottom toolbar
        bbar.insert(0, dButton );
    }
};

(function(){
    var E = ExperienceAEM.Sidekick;

    if( ( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)){
        //when the sidekick is ready CQ fires sidekickready event
        CQ.WCM.on("sidekickready", function(sk){
            //after the sidekick content is loaded, add wcmmode disabled button
            sk.on("loadcontent", function(){
                E.addWCMModeDisabled(sk);
            });
        });
    }
})();