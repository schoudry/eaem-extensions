CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.SideDiff = {
    LEFT_PANE: 'eaem-left-pane',
    RIGHT_PANE: 'eaem-right-pane',
    BUT_ID: 'eaem-side-diff',

    createDiffWindow: function(lUrl, rUrl){
        var E = ExperienceAEM.SideDiff;

        //scale down the iframe to 80% for better view
        var frameStyle= "style='width: 1000px; height: 1000px; " +
                        "-webkit-transform: scale(0.8); -webkit-transform-origin: 0 0; " +
                        "-moz-transform: scale(0.8); -moz-transform-origin: 0px 0px;'";

        var lFrame = "<iframe " + frameStyle + " id='" + E.LEFT_PANE + "' src='" + lUrl + "'></iframe>";
        var rFrame = "<iframe " + frameStyle + " id='" + E.RIGHT_PANE + "' src='" + rUrl + "'></iframe>";

        var divStyle = "width: 800px; height: 1000px; ";

        var lBox = new CQ.Ext.BoxComponent({
            autoEl: { tag: 'div', html: lFrame, style: divStyle }
        });

        var rBox = new CQ.Ext.BoxComponent({
            autoEl: { tag: 'div', html: rFrame, style: divStyle }
        });

        var panel = new CQ.Ext.Panel({
            header: false,
            border: false,
            layout:'fit',
            height: 820,
            width: 1600,
            items:[{
                layout:'table',
                layoutConfig: {
                    columns: 2
                },
                items:[lBox , rBox ]
            }]
        });

        var config = {
            title: "Side by Side Compare",
            x: 25,
            y:37,
            items: [ panel ]
        };

        var win = new CQ.Ext.Window(config);

        win.on('show', function(){
            var $left = $("#" + E.LEFT_PANE), $right = $("#" + E.RIGHT_PANE);

            //to keep view in sync, the two iframes listen to scroll events of each other
            evenScroll($left, $right);
            evenScroll($right, $left);

            win.toFront(true);
        });

        function evenScroll($one, $two){
            $one.load(function(){
                $($one[0].contentWindow.document).scroll(function(){
                    var $this = $(this);
                    $two[0].contentWindow.scrollTo($this.scrollLeft(),$this.scrollTop());
                });
            });
        }

        win.show();
    },

    addButton: function(){
        var E = ExperienceAEM.SideDiff;

        //buttons panel is the first component of "Restore Version" panel
        var bPanel = this.getComponent(0);
        var sideDiff = bPanel.getComponent(E.BUT_ID);

        //check if side diff button was already added
        if( sideDiff != null){
            return;
        }

        var sk = CQ.WCM.getSidekick();

        //get the grid containing versions.. grid panel is the second component of "Restore Version" panel
        //grid is the only component in grid panel
        var grid = this.getComponent(1).getComponent(0);

        sideDiff = {
            xtype: "button",
            id: E.BUT_ID,
            text: "| Diff |",
            handler: function() {
                var rec = grid.getSelectionModel().getSelected();

                if (!rec) {
                    CQ.Ext.Msg.alert("Select", "Please select a version");
                    return;
                }

                var HTTP = CQ.HTTP;

                var left = HTTP.externalize(sk.getPath() + ".html");
                var right = HTTP.externalize(sk.getPath() + ".html");

                left = HTTP.addParameter(left, "cq_diffTo", rec.data.label);
                left = HTTP.addParameter(left, "wcmmode", "disabled");
                left = HTTP.noCaching(left);

                right = HTTP.addParameter(right, "wcmmode", "disabled");
                right = HTTP.noCaching(right);

                E.createDiffWindow(left, right);
            }
        };

        bPanel.add(sideDiff);

        this.doLayout();
    },

    getPanel: function(){
        var sk = CQ.WCM.getSidekick();

        if(!sk){
            return null;
        }

        var rVersion = null;

        try{
            var vPanel = sk.panels[CQ.wcm.Sidekick.VERSIONING];

            if(!vPanel){
                return null;
            }

            rVersion = vPanel.findBy(function(comp){
                return comp["title"] == "Restore Version";
            });

            if(_.isEmpty(rVersion)){
                return null;
            }
        }catch(err){
            console.log("Error adding side by side diff", err);
        }

        return rVersion[0];
    }
};

(function(){
    var pathName = window.location.pathname;

    if( ( pathName !== "/cf" ) && ( pathName.indexOf("/content") !== 0)){
        return;
    }

    var E = ExperienceAEM.SideDiff;

    var SK_INTERVAL = setInterval(function(){
        //get the Restore Version panel
        var panel = E.getPanel();

        if(!panel){
            return;
        }

        clearInterval(SK_INTERVAL);

        panel.on('activate', E.addButton);
    }, 250);
})();