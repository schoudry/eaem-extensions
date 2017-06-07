CQ.Ext.ns("MyClientLib");

MyClientLib.SiteAdmin = {
    SA_GRID: "cq-siteadmin-grid",
    ACTIVATE_BUT: "Activate",
    ACTIVATE_LATER_BUT: "Activate Later...",
    ACTIVATE_LATER_DID: "cq-activate-later-dialog",
    ACTIVATIONS_GRID_ID_PREFIX: "myclientlib-scheduled-activations-grid",

    getGrid: function(config){
        var store = new CQ.Ext.data.Store({
            baseParams: config.storeBaseParams,
            proxy: new CQ.Ext.data.HttpProxy({
                "autoLoad":false,
                url: "/bin/mycomponents/schactivation",
                method: 'GET'
            }),
            reader: new CQ.Ext.data.JsonReader({
                root: 'data',
                fields: [
                    {name: 'id', mapping: 'id'},
                    {name: 'name', mapping: 'name'},
                    {name: 'path', mapping: 'path'},
                    {name: 'actDate', mapping: 'dt'},
                    {name: 'startDate', mapping: 'st'},
                    {name: 'initiator', mapping: 'ini'}
                ]
            })
        });

        store.load();

        return new CQ.Ext.grid.GridPanel({
            store: store,
            id: config.gridId,
            colModel: new CQ.Ext.grid.ColumnModel({
                defaults: {
                    width: 120,
                    sortable: true
                },
                columns: [
                    {id: 'name', header: 'Name', width: 80, dataIndex: 'name'},
                    {id: 'path', header: 'Path', width: 160, dataIndex: 'path'},
                    {id: 'actDate', width: 160, header: config.actColHeader, dataIndex: 'actDate'},
                    {id: 'startDate', header: 'Start Date', dataIndex: 'startDate'},
                    {id: 'initiator', header: 'Initiator', width: 80, dataIndex: 'initiator'}
                ]
            }),
            sm: new CQ.Ext.grid.RowSelectionModel(),
            tbar: [{
                xtype: "tbbutton",
                text: 'Terminate',
                disabled: true,
                tooltip: 'Terminate the selected workflows',
                handler: function(){
                    var commentBox = new CQ.Ext.form.TextArea({
                        xtype: 'textarea',
                        name:'terminateComment',
                        fieldLabel:CQ.I18n.getMessage('Comment')
                    });

                    var tConfig = {
                        xtype: 'dialog',
                        title:CQ.I18n.getMessage('Terminate Workflow'),
                        params: {"_charset_":"utf-8"},
                        items: {
                            xtype:'panel',
                            items:[commentBox,{
                                xtype: 'hidden',
                                name:'state',
                                value:'ABORTED'
                            }]
                        },
                        buttons:[{
                            "text": CQ.I18n.getMessage("OK"),
                            "handler": function() {
                                var sGrid = CQ.Ext.getCmp(config.gridId);

                                var sFunc = function(options, success, response) {
                                    if (!success) {
                                        CQ.Ext.Msg.alert(CQ.I18n.getMessage("Error"),
                                            CQ.I18n.getMessage("Termination of workflow failed"));
                                    }else{
                                        sGrid.getStore().reload();
                                    }
                                };

                                CQ.Ext.each(sGrid.getSelectionModel().getSelections(), function(selection){
                                    CQ.HTTP.post(selection.id,sFunc,{
                                            "state":"ABORTED",
                                            "_charset_":"utf-8",
                                            "terminateComment": commentBox.getValue()
                                        }
                                    );
                                });

                                this.close();
                            }
                        },CQ.Dialog.CANCEL ]
                    };

                    var tDialog = CQ.WCM.getDialog(tConfig);
                    tDialog.show();
                }
            }],
            width: 600,
            height: 350,
            frame: true,
            title: config.title,
            style: "margin:25px 0 0 0",
            listeners: {
                'click': function(){
                    var button = this.getTopToolbar().find('xtype','tbbutton')[0];
                    button.setDisabled(false);
                }
            }
        });
    },

    addGrid: function(grid, config){
        var toolBar = grid.getTopToolbar();

        var actBut = toolBar.find("text", config.topButtonName)[0];
        var actLaterBut = actBut.menu.find("text", config.laterButtonName);

        if(!actLaterBut || actLaterBut.length == 0){
            return;
        }

        actLaterBut[0].on('click', function(){
            var nextId = CQ.Util.createId(config.dialogIdPrefix);
            nextId = parseInt(nextId.substring(nextId.lastIndexOf("-") + 1), 10);

            var prevId = config.dialogIdPrefix + "-" + (nextId - 1);
            var dialog = CQ.Ext.getCmp(prevId);

            if(!dialog){
                return;
            }

            dialog.setWidth(700);
            dialog.setHeight(500);

            var panel = dialog.findBy(function(comp){
                return comp["jcr:primaryType"] == "cq:Panel";
            }, dialog);

            if(!panel || panel.length == 0){
                return;
            }

            panel = panel[0];
            var paths = "";

            CQ.Ext.each(grid.getSelectionModel().getSelections(), function(row){
                paths = paths+ row.id + ",";
            });

            var gConfig = {};

            gConfig.gridId = CQ.Util.createId(config.gridIdPrefix);
            gConfig.title = config.gridTitle;
            gConfig.actColHeader = config.actColHeader;
            gConfig.storeBaseParams = { path : paths.substr(0, paths.lastIndexOf(",")), type: config.gridType };

            panel.add(this.getGrid(gConfig));
            panel.doLayout();
        },this);
    },

    addScheduledActivationGrid: function(grid){
        var config = {};

        config.topButtonName = this.ACTIVATE_BUT;
        config.laterButtonName = this.ACTIVATE_LATER_BUT;
        config.dialogIdPrefix = this.ACTIVATE_LATER_DID;
        config.gridIdPrefix = this.ACTIVATIONS_GRID_ID_PREFIX;
        config.gridTitle = 'Pending Scheduled Activations';
        config.actColHeader = 'Activation Date';
        config.gridType = "ACTIVATE";

        this.addGrid(grid, config);
    }
};

(function(){
    if(window.location.pathname == "/siteadmin"){
        var INTERVAL = setInterval(function(){
            var s = MyClientLib.SiteAdmin;
            var grid = CQ.Ext.getCmp(s.SA_GRID);

            if(grid){
                clearInterval(INTERVAL);
                s.addScheduledActivationGrid(grid);
            }
        }, 250);
    }
})();