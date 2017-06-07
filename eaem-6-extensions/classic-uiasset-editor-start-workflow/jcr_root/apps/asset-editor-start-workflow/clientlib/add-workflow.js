(function(){
    var isAlreadyInWorkflow = function(pagePath){
        var url = CQ.HTTP.noCaching("/bin/workflow.json");
        url = CQ.HTTP.addParameter(url, "isInWorkflow", pagePath);
        url = CQ.HTTP.addParameter(url, "_charset_", "UTF-8");

        var response = CQ.HTTP.get(url);
        var isInWorkflow = false;

        if (CQ.HTTP.isOk(response)) {
            var data = CQ.Util.eval(response);
            isInWorkflow = data.status;
        }

        return  isInWorkflow;
    };

    var showWorkflowDialog = function(pagePath){
        var id = CQ.Util.createId("cq-workflowdialog");

        //this dialog config was copied from \libs\cq\ui\widgets\source\widgets\wcm\SiteAdmin.Actions.js
        var startWorkflowDialog = {
            "jcr:primaryType": "cq:Dialog",
            "title":CQ.I18n.getMessage("Start Workflow"),
            "id": id,
            "formUrl":"/etc/workflow/instances",
            "params": {
                "_charset_":"utf-8",
                "payloadType":"JCR_PATH"
            },
            "items": {
                "jcr:primaryType": "cq:Panel",
                "items": {
                    "jcr:primaryType": "cq:WidgetCollection",
                    "model": {
                        "xtype":"combo",
                        "name":"model",
                        "id": id + "-model",
                        "hiddenName":"model",
                        "fieldLabel":CQ.I18n.getMessage("Workflow"),
                        "displayField":"label",
                        "valueField":"wid",
                        "title":CQ.I18n.getMessage("Available Workflows"),
                        "selectOnFocus":true,
                        "triggerAction":"all",
                        "allowBlank":false,
                        "editable":false,
                        "store":new CQ.Ext.data.Store({
                            "proxy":new CQ.Ext.data.HttpProxy({
                                "url":"/libs/cq/workflow/content/console/workflows.json",
                                "method":"GET"
                            }),
                            "baseParams": { tags: 'wcm' },
                            "reader":new CQ.Ext.data.JsonReader({
                                    "totalProperty":"results",
                                    "root":"workflows"
                                },
                                [ {"name":"wid"}, {"name":"label"}, {"name": CQ.shared.XSS.getXSSPropertyName("label")} ]
                            )
                        }),
                        "tpl": new CQ.Ext.XTemplate(
                            '<tpl for=".">',
                            '<div class="x-combo-list-item">',
                            '{[CQ.I18n.getVarMessage(CQ.shared.XSS.getXSSTablePropertyValue(values, \"label\"))]}',
                            '</div>',
                            '</tpl>'
                        )
                    },
                    "comment": {
                        "jcr:primaryType": "cq:TextArea",
                        "fieldLabel":CQ.I18n.getMessage("Comment"),
                        "name":"startComment",
                        "height":200
                    },
                    "title": {
                        xtype: 'textfield',
                        name:'workflowTitle',
                        fieldLabel:CQ.I18n.getMessage('Workflow Title')
                    }
                }
            },
            "okText":CQ.I18n.getMessage("Start")
        };

        var dialog = CQ.WCM.getDialog(startWorkflowDialog);

        dialog.addHidden({ "payload": pagePath } );

        dialog.success = function(){
            CQ.Ext.Msg.alert("Workflow","Workflow started on asset - " + pagePath);
        };

        dialog.show();
    };

    var addWorkflowButton = function(bbar, pagePath){
        var wButton = new CQ.Ext.Button({
            "text": "Start Workflow",
            "cls": "cq-btn-save",
            "handler": function() {
                var isInWorkflow = isAlreadyInWorkflow(pagePath);

                if (isInWorkflow) {
                    CQ.Ext.Msg.alert("Workflow", CQ.I18n.getMessage("Asset is already subject to a workflow!"));
                    return;
                }

                showWorkflowDialog(pagePath);
            }
        });

        bbar.insertButton(1, wButton);
    };

    var INTERVAL = setInterval(function(){
        var tabPanel = CQ.Ext.getCmp("cq-damadmin-tabpanel");

        if(tabPanel){
            clearInterval(INTERVAL);

            tabPanel.on("add", function(t, assetEditor){
                addWorkflowButton(assetEditor.formPanel.getBottomToolbar(), assetEditor.path);
            });
        }
    }, 250);
})();