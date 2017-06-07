(function(){
    var DELAY = 5000, //millis
        PROPS_DIALOG_PREFIX = "cq-propsdialog-",
        SA_GRID = "cq-siteadmin-grid";

    //for sidekick page properties dialog
    if( window.location.pathname.indexOf("/content") == 0 ){
        handleSideKickPPDialog();
    }

    //for siteadmin page properties dialog
    if( window.location.pathname.indexOf("/siteadmin") == 0 ){
        handleSiteAdminPPDialog();
    }

    function handleSideKickPPDialog(){
        var SK_INTERVAL = setInterval(function(){
            var sk = CQ.WCM.getSidekick();

            if(sk){
                clearInterval(SK_INTERVAL);

                disableSKOk(sk);
            }
        }, 250);

        function disableSKOk(sk){
            var dialog = CQ.WCM.getDialog(sk.initialConfig.propsDialog);

            if(!dialog){
                return;
            }

            var OK_TIMEOUT;

            dialog.on('show', function(){
                var okButton = dialog.buttons[0];

                okButton.setDisabled(true);

                OK_TIMEOUT = setTimeout(function(){
                    okButton.setDisabled(false);
                }, DELAY);
            });

            dialog.on('hide', function(){
                //sidekick page properties dialog is not destroyed (unlike siteadmin page properties)
                //so clear timeout if the dialog was cancelled before timeout
                clearTimeout(OK_TIMEOUT);
            })
        }
    }

    function handleSiteAdminPPDialog(){
        function disableSiteAdminOk(){
            try{
                //find the extjs dialog component by querying underlying dom structure
                var element = CQ.Ext.get($("[id^=cq-propsdialog-]")[0].id),
                    tabChild = element.child('div.x-tab-panel'),
                    tabPanel = CQ.Ext.getCmp(tabChild.id),
                    dialog = tabPanel.findParentByType("dialog");

                var okButton = dialog.buttons[0];

                okButton.setDisabled(true);

                setTimeout(function(){
                    //if the dialog was cancelled before timeout, ok button gets destroyed
                    if(okButton.el.dom){
                        okButton.setDisabled(false);
                    }
                }, DELAY);
            }catch(err){
                console.log("Error getting properties dialog", err);
            }
        }

        function addListener(){
            var DG_INTERVAL = setInterval(function(){
                var propsDiv = $("[id^=" + PROPS_DIALOG_PREFIX + "]");

                if(propsDiv.length == 0){
                    return;
                }

                clearInterval(DG_INTERVAL);

                disableSiteAdminOk();
            }, 250);
        }

        function addPropertiesListener(grid){
            grid.on('rowcontextmenu',function(grid){
                var properties = grid.contextMenu.find("text", "Properties...");

                if(properties.length == 0){
                    return;
                }

                //add the disable listeners on properties button click
                properties[0].on('click', addListener());
            }, this);
        }

        var INTERVAL = setInterval(function(){
            var grid = CQ.Ext.getCmp(SA_GRID);

            if(grid){
                clearInterval(INTERVAL);

                addPropertiesListener(grid);
            }
        }, 250);
    }
})();