CQ.Ext.ns("ExperienceAEM.PasswordMgmt");

ExperienceAEM.PasswordMgmt = {
    getChangePasswordDialog: function(userPath, passwordExpiryInDays){
        var dialogCfg = CQ.Util.copyObject(CQ.UserInfo.PASSWORD_DIALOG_CFG);

        dialogCfg.title = "Password Expired";
        dialogCfg.buttons = CQ.Dialog.OK;
        dialogCfg.closable = false;

        dialogCfg.ok = function(){
            var dialog = this;

            var find = function(panel, name){
                return panel.findBy(function(comp){
                    return comp["name"] == name;
                }, panel);
            };

            var currentPassword = find(dialog, ":currentPassword");
            var passwords = find(dialog, "rep:password");

            if(currentPassword[0].getValue() && passwords[0].getValue() && passwords[1].getValue()){
                if(passwords[0].getValue() == passwords[1].getValue()){
                    var options = {
                        _charset_: "utf-8",
                        ":status": "browser",
                        ":currentPassword": currentPassword[0].getValue(),
                        "rep:password": passwords[0].getValue()
                    };

                    $.ajax({
                        url: userPath + ".rw.html",
                        dataType: "html",
                        data: options,
                        success: function(){
                            $.ajax({
                                url: "/bin/experience-aem/pm/expiry",
                                dataType: "json",
                                success: function(){
                                    CQ.Notification.notify("Password changed","New password expires in " + passwordExpiryInDays + " days");

                                    dialog.close();
                                    CQ.Ext.getBody().unmask();

                                    if (( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)) {
                                        location.reload();
                                    }
                                },
                                error: function(j, t, e){
                                    alert("Error changing password, couldn't set last changed date");
                                },
                                type: 'POST'
                            });
                        },
                        error: function(j, t, e){
                            alert("Either the old password is incorrect or there is some error");
                        },
                        type: 'POST'
                    });
                }
            }
        };

        return CQ.WCM.getDialog(dialogCfg);
    },

    showChangePasswordDialog: function(){
        $.ajax({ url: "/bin/experience-aem/pm/expiry", dataType: "json", async: false,
            success: function(data){
                var expired = data["expired"];

                if(expired){
                    var dialog = this.getChangePasswordDialog(data["userPath"], data["passwordExpiryInDays"]);
                    CQ.Ext.getBody().mask();

                    if (( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)) {
                        var cf = CQ.WCM.getContentFinder();

                        if(cf){
                            cf.getEl().mask();
                        }

                        if (CQ.WCM.isEditMode() || CQ.WCM.isDesignMode()) {
                            CQ.WCM.on("sidekickready", function(sk){
                                sk.getEl().mask()
                            });
                        }
                    }

                    dialog.show();
                }
            }.createDelegate(this),
            type: "GET"
        });
    },

    addExpiryOptions: function(propPanel){
        var userForm = propPanel.userForm;
        var emailComp = userForm.find('name', 'email')[0];

        var passwordExpiryInDays = {
            "xtype":"textfield",
            "fieldLabel": "Expire password (days)",
            "anchor":"15%",
            "name":"passwordExpiryInDays"
        };

        userForm.insert(userForm.items.indexOf(emailComp) + 1, passwordExpiryInDays);

        userForm.setAutoScroll(true);
        userForm.doLayout();
    }
};

(function() {
    var PM = ExperienceAEM.PasswordMgmt;

    CQ.Ext.onReady(function(){
        PM.showChangePasswordDialog();
    });

    if(window.location.pathname == "/useradmin"){
        var fields = CQ.security.data.AuthRecord.FIELDS;
        fields.push({"name": "passwordExpiryInDays"});
        //fields.push({"name": "passwordExpiryReminderInDays"});

        var UA_INTERVAL = setInterval(function(){
            var userAdmin = CQ.Ext.getCmp("cq-useradmin");

            if(userAdmin && userAdmin.userProperties){
                clearInterval(UA_INTERVAL);
                PM.addExpiryOptions(userAdmin.userProperties);
            }
        }, 250);
    }
})();
