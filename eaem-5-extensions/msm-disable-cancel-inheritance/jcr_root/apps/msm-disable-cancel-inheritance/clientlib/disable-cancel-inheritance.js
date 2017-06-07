CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.CreateSite = {
    disableCancelInheritanceFlag: false,

    //add the disable cancel inheritance option to create site wizard
    addDisableCancelInheritance: function(grid){
        var toolBar = grid.getTopToolbar();

        var newMenu = toolBar.findBy(function(comp){
            return comp["iconCls"] == "cq-siteadmin-create-page-icon";
        }, toolBar)[0];

        var newSite = newMenu.menu.findBy(function(comp){
            return comp["iconCls"] == "cq-siteadmin-create-site-icon";
        }, newMenu)[0];

        newSite.on('click', function(){
            var dlg = CQ.WCM.getDialog("", "cq-siteadmin-csw", true);

            dlg.navHandler = function(d) {
                CQ.wcm.CreateSiteWizard.prototype.navHandler.call(this, d);
                var idx = this.activePage + d;

                //we are at the live copy page in wizard
                if(idx == 4){
                    var liveCopyPanel = this.wizPanel.layout.activeItem;
                    liveCopyPanel.add(new CQ.Ext.form.Checkbox({
                        fieldDescription: "Live copy owners will not be able to cancel component inheritance",
                        fieldLabel: 'Disable Cancel Inheritance',
                        name: "./cq:isDisableCancelInheritance",
                        inputValue: true,
                        checked: false
                    }));
                    liveCopyPanel.doLayout();
                }
            };
        })
    },

    disableCancelInheritance: function(){
        var sk = CQ.WCM.getSidekick();
        var pathTokens = sk.getPath().split("/");
        var siteSourcePath = "/" + pathTokens[1] + "/" + pathTokens[2] + "/jcr:content.json";

        $.ajax({ url: siteSourcePath, async: false, dataType: "json",
            success: function(data){
                this.disableCancelInheritanceFlag = eval(data["cq:isDisableCancelInheritance"]);
            }.createDelegate(this)
        });

        if(!this.disableCancelInheritanceFlag){
            return;
        }

        var editables = CQ.utils.WCM.getEditables();

        CQ.Ext.iterate(editables, function(path, editable) {
            if(!editable.addElementEventListener){
                if(editable.liveStatus){
                    editable.liveStatus.setDisabled(true);
                    editable.liveStatus.setTooltip("Creator of this livecopy has disabled cancel inheritance");
                }
                return;
            }

            editable.on(CQ.wcm.EditBase.EVENT_BEFORE_EDIT, function(){
                var INTERVAL = setInterval(function(){
                    var dialog = editable.dialogs[CQ.wcm.EditBase.EDIT];

                    if(dialog){
                        clearInterval(INTERVAL);

                        if(dialog.editLockButton){
                            dialog.editLockButton.setDisabled(true);
                            dialog.editLockButton.setTooltip("Creator of this livecopy has disabled cancel inheritance");
                        }
                    }
                }, 200);
            });

            //disable some inheritance specific options in context menu
            editable.addElementEventListener(editable.element.dom, "contextmenu" , function(){
                var msm = this["msm:liveRelationship"];

                if(!msm || !msm["msm:status"] || !msm["msm:status"]["msm:isSourceExisting"]){
                    return;
                }

                var component = this.element.linkedEditComponent;

                if (!component || !component.menuComponent) {
                    return;
                }

                var menu = component.menuComponent;
                var opts = [ menu.find('text', "Delete"), menu.find('text', "Cut") ];

                CQ.Ext.each(opts, function(opt){
                    if(opt && opt.length > 0){
                        opt[0].setDisabled(true);
                    }
                });
            }, true, editable);

            //disable the top right lock icon of editable
            editable.element.on('click', function(){
                var lock = this.highlight.lock;

                if(lock){
                    lock.getEl().dom.title = "Creator of this livecopy has disabled cancel inheritance";
                    lock.setDisabled(true);
                    lock.getEl().removeAllListeners();
                }
            }, editable);
        });

        //disable the sidekick lock status button which allows cancel inheritance of editables
        var lcsBut = sk.liveCopyStatusButton;

        if(lcsBut){
            lcsBut.setDisabled(true);
            lcsBut.setTooltip("Creator of this livecopy has disabled livecopy status");
        }else{
            sk.on('loadcontent', function(){
                lcsBut = sk.liveCopyStatusButton;
                lcsBut.setDisabled(true);
                lcsBut.setTooltip("Creator of this livecopy has disabled livecopy status");
            });
        }

        /*CQ.WCM.getSidekick().liveCopyStatusButton.on('click', function(){
            CQ.Ext.iterate(editables, function(path, editable) {
                if(editable.enableLiveRelationship){
                    var INTERVAL = setInterval(function(){
                        var lsr = editable.liveStatusRendered;

                        if(lsr){
                            clearInterval(INTERVAL);

                            var fr = editable.liveStatus.frameRight;
                            fr.getEl().dom.title = "Creator of this livecopy has disabled cancel inheritance";
                            fr.getEl().removeAllListeners();
                        }
                    }, 200);
                }
            });
        });*/
    },

    //register this function as listener for "loadcontent" event on dialog
    disableSkCancelInheritance: function(dialog){
        if(!this.disableCancelInheritanceFlag){
            return;
        }

        var fields = CQ.Util.findFormFields(dialog.formPanel);

        CQ.Ext.iterate(fields, function(name, f){
            CQ.Ext.each(f, function(field){
                if(field.lockPanel){
                    field.lockPanel.setDisabled(true);
                }else if(field.fieldEditLockBtn){
                    field.fieldEditLockBtn.setDisabled(true);
                    field.fieldEditLockBtn.setTooltip("Creator of this livecopy has disabled cancel inheritance");
                }
            })
        });
    }
};

(function(){
    var E = ExperienceAEM.CreateSite;

    if(window.location.pathname == "/siteadmin"){
        var INTERVAL = setInterval(function(){
            var grid = CQ.Ext.getCmp("cq-siteadmin-grid");

            if(grid){
                clearInterval(INTERVAL);
                E.addDisableCancelInheritance(grid);
            }
        }, 250);
    }else if( ( window.location.pathname == "/cf" ) || ( window.location.pathname.indexOf("/content") == 0)){
        if(CQ.WCM.isEditMode()){
            CQ.WCM.on("editablesready", E.disableCancelInheritance, E);
        }
    }
})();
