CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.Sidekick = {
    OPEN_TOUCH_UI: "experience-aem-sk-button-open-touch-ui",

    //add the button to sidekick bottom bar
    addTouchUIButton: function(sk){
        var bbar = sk.getBottomToolbar();
        var oButton = bbar.getComponent(0);

        //if the sidekick is reloaded, remove existing and add a fresh one
        if(oButton.getId() == this.OPEN_TOUCH_UI){
            bbar.remove(oButton, true);
        }

        oButton = new CQ.Ext.Button({
            id: this.OPEN_TOUCH_UI,
            iconCls: "cq-sidekick-open-touch-ui",
            tooltip: {
                title: "Touch UI",
                text: "Open page in Touch UI"
            },
            handler: function() {
                var win = CQ.WCM.isContentWindow(window) ?  window.parent : window;
                win.open("/editor.html" + sk.getPath() + ".html","_blank");
            },
            scope: sk
        });

        //add the button as first component in bottom toolbar
        bbar.insert(0, oButton );
    }
};

(function(){
    var E = ExperienceAEM.Sidekick;

    if( ( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)){
        //when the sidekick is ready CQ fires sidekickready event
        CQ.WCM.on("sidekickready", function(sk){
            //after the sidekick content is loaded, add button
            sk.on("loadcontent", function(){
                E.addTouchUIButton(sk);
            });
        });
    }
})();