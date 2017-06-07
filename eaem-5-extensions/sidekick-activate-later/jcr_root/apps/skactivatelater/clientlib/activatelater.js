CQ.Ext.ns("MyClientLib");

MyClientLib.ContentFinder = {
    scheduleForActivation: function (sideKick) {
        var scheduleForActivationDialog = {
            "jcr:primaryType": "cq:Dialog",
            "height": 240,
            "title": CQ.I18n.getMessage("Activate Later"),
            "id": CQ.Util.createId("myclientlib-cq-activate-later-dialog"),
            "params": {
                "_charset_": "utf-8"
            },
            "items": {
                "jcr:primaryType": "cq:Panel",
                "items": {
                    "jcr:primaryType": "cq:WidgetCollection",
                    "absTime": {
                        "xtype": "datetime",
                        "fieldLabel": CQ.I18n.getMessage("Activation Date"),
                        "name": "absTime",
                        "defaultValue": "now"
                    }
                }
            },
            "buttons": {
                "jcr:primaryType": "cq:WidgetCollection",
                "custom": {
                    "text": CQ.I18n.getMessage("OK"),
                    "cls": "cq-btn-create",
                    "handler": function () {
                        var dlg = this;
                        var paths = [ sideKick.getPath() ];
                        var dateTime = this.getField("absTime").getValue();

                        var data = {
                            id: CQ.Util.createId("myclientlib-cq-asset-reference-search-dialog"),
                            path: paths,
                            callback: function(p) {
                                var params = {
                                    "_charset_":"UTF-8",
                                    "model":"/etc/workflow/models/scheduled_activation/jcr:content/model",
                                    "absoluteTime": dateTime ? dateTime.getTime() : new Date().getTime(),
                                    "payload":paths,
                                    "payloadType":"JCR_PATH"
                                };
                                CQ.HTTP.post("/etc/workflow/instances",
                                    function(options, success, response) {
                                        if (!success) {
                                            CQ.Ext.Msg.alert(
                                                CQ.I18n.getMessage("Error"),
                                                CQ.I18n.getMessage("Could not schedule page for activation."));
                                        } else {
                                            CQ.Ext.Msg.alert("Success","Page scheduled for activation : " + dateTime);
                                        }
                                    },params
                                );

                                dlg.hide();
                            }
                        };
                        new CQ.wcm.AssetReferenceSearchDialog(data);
                    }
                },
                "cancel": CQ.Dialog.CANCEL
            }
        };
        var dialog = CQ.WCM.getDialog(scheduleForActivationDialog);
        dialog.show();
    },

    addActivateLater: function(sk){
        var pagePanel = sk.panels["PAGE"];

        var button = pagePanel.findBy(function(comp){
            return comp["name"] == "ACTIVATE_LATER";
        }, pagePanel);

        if(button && button.length > 0){
            return;
        }

        button = {
            xtype: "button",
            scope: sk,
            name: "ACTIVATE_LATER",
            text: "Activate Later",
            "context": [
                CQ.wcm.Sidekick.PAGE
            ],
            handler: function(){
                MyClientLib.ContentFinder.scheduleForActivation(sk);
            }
        };

        pagePanel.insert(6,button);
        sk.actns.push(button);
    }
};

(function(){
    var c = MyClientLib.ContentFinder;

    if( ( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)){
        var SK_INTERVAL = setInterval(function(){
            var sk = CQ.WCM.getSidekick();

            if(sk){
                clearInterval(SK_INTERVAL);
                c.addActivateLater(sk);
            }
        }, 250);
    }
})();