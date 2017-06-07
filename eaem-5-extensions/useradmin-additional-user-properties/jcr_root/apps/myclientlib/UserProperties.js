CQ.Ext.ns("MyClientLib");

MyClientLib.UserAdmin = {
    addSecondEmail: function(propPanel){
        var userForm = propPanel.userForm;
        var emailComp = userForm.find('name', 'email');

        var secondEmailComp = {
            "xtype":"textfield",
            "fieldLabel": "Second Email",
            "anchor":"100%",
            "name":"secondEmail"
        };

        userForm.insert(userForm.items.indexOf(emailComp[0]) + 1, secondEmailComp);
        userForm.doLayout();
    }
};

(function(){
    if(window.location.pathname == "/useradmin"){
        var fields = CQ.security.data.AuthRecord.FIELDS;
        fields.push({"name": "secondEmail"});

        var UA_INTERVAL = setInterval(function(){
            var userAdmin = CQ.Ext.getCmp("cq-useradmin");

            if(userAdmin && userAdmin.userProperties){
                clearInterval(UA_INTERVAL);
                MyClientLib.UserAdmin.addSecondEmail(userAdmin.userProperties);
            }
        }, 250);
    }
})();