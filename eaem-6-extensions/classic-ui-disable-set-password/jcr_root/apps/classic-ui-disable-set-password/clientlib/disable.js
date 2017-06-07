(function(){
    //id set in \libs\cq\security\widgets\source\widgets\security\UserAdmin.js
    var USER_ADMIN_ID = "cq-useradmin";

    if(window.location.pathname == "/useradmin"){
        var UA_INTERVAL = setInterval(function(){
            var userAdmin = CQ.Ext.getCmp(USER_ADMIN_ID);

            if(userAdmin && userAdmin.userProperties && userAdmin.userProperties.pwdButtons){
                clearInterval(UA_INTERVAL);

                var pwdButtons = userAdmin.userProperties.pwdButtons;
                var setPassword = pwdButtons.filter("text", "Set Password").get(0);
                var authorizableList = userAdmin.list;

                authorizableList.getSelectionModel().on('selectionchange', function(sm){
                    var selected = sm.getSelected();

                    if(!selected){
                        return;
                    }

                    //var hasPerm = CQ.User.getCurrentUser().hasPermissionOn("modify", selected.data.home);

                    var user = CQ.User.getCurrentUser();

                    setPassword.setDisabled(true);

                    $.ajax({
                        url: "/.cqactions.json",
                        data: {
                            path: selected.data.home,
                            authorizableId: user.getUserID()
                        }
                    }).done(function(data){
                        setPassword.setDisabled(!data.entries[0].modify);
                    });
                });
            }
        }, 250);
    }
})();