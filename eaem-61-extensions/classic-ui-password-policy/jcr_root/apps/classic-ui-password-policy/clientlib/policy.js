(function(){
    if(window.location.pathname != "/useradmin"){
        return;
    }

    //password validation text
    var POLICY_TEXT = "New Password must contain atleast one number";

    //add your policy implementation logic in the below function returning true/false
    function isValidPassword(text){
        if(!text){
            return false;
        }

        //check for number in text
        return /\d/.test(text);
    }

    var UA_INTERVAL = setInterval(function(){
        var userAdmin = CQ.Ext.getCmp("cq-useradmin");

        if(userAdmin && userAdmin.userProperties){
            clearInterval(UA_INTERVAL);

            var pwdButton = userAdmin.userProperties.pwdButtons.get(0);

            pwdButton.on("click", function(){
                findDialog("Set Password");
            });

            addPolicyToCreateUser(userAdmin);
        }
    }, 250);

    function addPolicyToCreateUser(userAdmin){
        var menu = null;

        try{
            menu = userAdmin.list.actions.edit.menu;
        }catch(err){
            console.log("Error reading menu");
        }

        var createMenu = menu.findBy(function(comp){
            return comp.text === "Create";
        })[0];

        var createUserItem = createMenu.menu.findBy(function(comp){
            return comp.text === "Create User";
        })[0];

        createUserItem.on("click", function(){
            findDialog("Create User");
        });
    }

    function findDialog(title){
        var wMgr = CQ.Ext.WindowMgr;

        //get the set password dialog from window manager; could not find dialog reference in userAdmin.userProperties
        var W_INTERVAL = setInterval(function () {
            wMgr.each(function (win) {
                if (win.title !== title) {
                    return;
                }

                clearInterval(W_INTERVAL);

                addPolicyText(win);

                addValidationHandler(win);
            });
        }, 250);
    }

    function addPolicyText(passwordWin){
        if(!passwordWin){
            return;
        }

        var panel = passwordWin.items.get(0);

        panel.body.insertHtml("afterBegin", "<div style='text-align:center; font-style: italic'>"
                                    + POLICY_TEXT + "</div><br>");
    }

    function addValidationHandler(passwordWin){
        passwordWin.on("beforesubmit", function(){
            var passField = this.findBy(function(comp){
                return comp.name == "rep:password";
            })[0];

            if(!isValidPassword(passField.getValue())){
                CQ.Ext.Msg.show({ title: "Error", msg: POLICY_TEXT,
                                buttons: CQ.Ext.Msg.OK, icon: CQ.Ext.Msg.ERROR});
                return false;
            }

            return true;
        })
    }
}());

