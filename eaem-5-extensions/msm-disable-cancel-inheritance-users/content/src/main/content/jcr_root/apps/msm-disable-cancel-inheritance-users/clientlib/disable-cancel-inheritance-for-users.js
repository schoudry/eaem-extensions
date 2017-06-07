CQ.Ext.ns("ExperienceAEM.MSM");

ExperienceAEM.MSM.Blueprint = {
    liveCopies: [],

    //the dialog for user to choose the live copy, user/group
    getCancelInheritanceDialog: function(path){
        path = path.substring(path.indexOf("/jcr:content"));

        var allow = new CQ.Ext.form.Label( { text: "Allow : Select a live copy" });
        var deny = new CQ.Ext.form.Label( { text: "Deny : Select a live copy" });

        var getLiveCopies = function(lBox){
            var lCopies = lBox.getValue();

            if(lCopies == "ALL"){
                var items = lBox.getStore().data.items;
                lCopies = [];

                CQ.Ext.each(items, function(item){
                    if(item.id == "ALL"){
                        return;
                    }

                    lCopies.push(item.id);
                });

                lCopies = lCopies.join(",");
            }

            return lCopies;
        };

        //updates the labels with users/groups allow/deny the jcr:write permission
        var showPrivileges = function(lBox){
            if(lBox.getValue() == "ALL"){
                allow.setText("Allow : Select a live copy");
                deny.setText("Deny : Select a live copy");
                return;
            }

            //get the allow/deny permissions as json
            $.ajax({ url: "/bin/experience-aem/msm/acl", dataType: "json",
                data: { path : lBox.getValue() + path, privilege: "jcr:write" },
                success: function(data){
                    var privs = data["allow"];

                    if(privs && !CQ.Ext.isEmpty(privs["jcr:write"])){
                        allow.setText("Allow : " + privs["jcr:write"].join(" "));
                    }else{
                        allow.setText("Allow : None set");
                    }

                    privs = data["deny"];

                    if(privs && privs["jcr:write"]){
                        deny.setText("Deny : " + privs["jcr:write"].join(" "));
                    }else{
                        deny.setText("Deny : None set");
                    }
                },
                type: "GET"
            });
        };

        var dialogConfig = {
            "jcr:primaryType": "cq:Dialog",
            title: "Set Inheritance Options - " + path,
            modal: true,
            width: 600,
            height: 300,
            items: [{
                xtype: "panel",
                layout: "form",
                bodyStyle :"padding: 20px",
                items: [{
                            xtype: "panel",
                            border: false,
                            bodyStyle :"margin-bottom: 10px",
                            items: allow
                        },{
                            xtype: "panel",
                            border: false,
                            bodyStyle :"margin-bottom: 25px",
                            items: deny
                        },{
                            anchor: "95%",
                            xtype: "combo",
                            style: "margin-bottom: 20px",
                            mode: 'local',
                            fieldLabel: "Select Live Copy",
                            store: new CQ.Ext.data.ArrayStore({
                                id: 0,
                                fields: [ 'id', 'text' ],
                                data: this.liveCopies
                            }),
                            valueField: 'id',
                            displayField: 'text',
                            triggerAction: "all",
                            listeners:{
                                scope: this,
                                'select': function(combo){
                                    //when a livecopy is selected, make an ajax call to get the jcr:write permission
                                    showPrivileges(combo);
                                }
                            }
                        },{
                            valueField: "id",
                            displayField: "name",
                            fieldLabel: "Select User/Group",
                            style: "margin-bottom: 20px",
                            autoSelect: true,
                            xtype: "authselection"
                        },{
                            xtype: 'radiogroup',
                            columns: 6,
                            fieldLabel: "Cancel Inheritance ",
                            items: [{
                                boxLabel: ' Allow',
                                name: 'type',
                                value: 'ALLOW',
                                checked: true
                            },{
                                name: 'type',
                                boxLabel: ' Deny',
                                value: 'DENY',
                                checked: false
                        }]
                    }]
            }],
            ok: function () {
                var lBox = this.findByType("combo")[0];
                var uBox = this.findByType("authselection")[0];
                var tBox = this.findByType("radiogroup")[0];

                var options = {
                    path: path,
                    liveCopies: getLiveCopies(lBox),
                    principal: uBox.getValue(),
                    type: tBox.getValue().value
                };

                this.close();

                //save the user/group allow/deny privileges on the live copy component
                $.ajax({
                    url: "/bin/experience-aem/msm/acl",
                    dataType: "json",
                    data: options,
                    success: function(){
                        CQ.Notification.notify("Cancel Inheritance","Access controls set for " + options.principal);
                    },
                    error: function(){
                        CQ.Notification.notify("Cancel Inheritance","Error setting access controls for " + options.principal);
                    },
                    type: 'POST'
                });
            }
        };

        return CQ.WCM.getDialog(dialogConfig);
    },

    //get the livecopies for a blueprint. If the site has not live copies "Set Cancel Inheritance" menu option is not shown
    readLiveCopies: function(){
        var sk = CQ.WCM.getSidekick();

        $.ajax({ url: sk.getPath() + "/jcr:content.blueprint.json", async: false, dataType: "json",
            success: function(data){
                if(!data){
                    return;
                }

                var liveCopies = data["msm:targets"];

                //return if there are no live copies
                if(CQ.Ext.isEmpty(liveCopies)){
                    return;
                }

                this.liveCopies.push( [ "ALL", "All" ] );

                CQ.Ext.each(liveCopies, function(lCopy){
                    this.liveCopies.push([ lCopy, lCopy ])
                }, this);
            }.createDelegate(this)
        });
    },

    //browse editables and add the Set Cancel Inheritance menu option
    addSetCancelInheritance: function () {
        this.readLiveCopies();

        if(CQ.Ext.isEmpty(this.liveCopies)){
            return;
        }

        var editables = CQ.utils.WCM.getEditables();

        CQ.Ext.iterate(editables, function (path, editable) {
            if(!editable.addElementEventListener){
                return;
            }

            editable.addElementEventListener(editable.element.dom, "contextmenu", function () {
                var component = this.element.linkedEditComponent;

                if (!component || !component.menuComponent) {
                    return;
                }

                var menu = component.menuComponent;

                if (menu.cancelInheritanceSet) {
                    return;
                }

                menu.addSeparator();

                menu.add({
                    text: "Set Cancel Inheritance",
                    handler: function () {
                        var dialog = ExperienceAEM.MSM.Blueprint.getCancelInheritanceDialog(path);
                        dialog.show();
                    }
                });

                menu.cancelInheritanceSet = true;
            }, true, editable);
        });
    }
};

(function() {
    var E = ExperienceAEM.MSM.Blueprint;

    if (( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)) {
        if (CQ.WCM.isEditMode()) {
            CQ.WCM.on("editablesready", E.addSetCancelInheritance, E);
        }
    }
})();
