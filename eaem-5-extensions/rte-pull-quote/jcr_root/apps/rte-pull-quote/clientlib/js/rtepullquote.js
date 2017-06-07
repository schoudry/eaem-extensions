CQ.Ext.ns("MyClientLib");

MyClientLib.PullQuote = {
    ADD_QUOTE_CMD : "addquote",
    REMOVE_QUOTE_CMD : "removequote",
    DEFAULT_PATTERN: "[pullquote:(align=<align>,text=<text>)]"
};

MyClientLib.PullQuote.Plugin = new Class({
    toString: "PullQuotePlugin",
    extend: CUI.rte.plugins.Plugin,
    P: MyClientLib.PullQuote,

    addQuoteUI: null,
    removeQuoteUI: null,

    getFeatures: function() {
        return [ this.P.ADD_QUOTE_CMD, this.P.REMOVE_QUOTE_CMD ];
    },

    initializeUI: function(tbGenerator) {
        var plg = CUI.rte.plugins;

        if (this.isFeatureEnabled(this.P.ADD_QUOTE_CMD)) {
            this.addQuoteUI = tbGenerator.createElement(this.P.ADD_QUOTE_CMD, this, true, "Add/Modify Pull Quote");
            tbGenerator.addElement("format", plg.Plugin.SORT_FORMAT,this.addQuoteUI,1000);
        }

        if (this.isFeatureEnabled(this.P.REMOVE_QUOTE_CMD)) {
            this.removeQuoteUI = tbGenerator.createElement(this.P.REMOVE_QUOTE_CMD, this, true,"Remove Pull Quote");
            tbGenerator.addElement("format", plg.Plugin.SORT_FORMAT,this.removeQuoteUI,1001);
        }
    },

    execute: function(cmd, value, env) {
        if (cmd == this.P.ADD_QUOTE_CMD) {
            this.showDialog(env.editContext);
        }else {
            this.editorKernel.relayCmd(MyClientLib.PullQuote.REMOVE_QUOTE_CMD, value);
        }
    },

    showDialog: function(context) {
        var editorKernel = this.editorKernel, dm = editorKernel.getDialogManager(), pattern = this.config.pattern;

        if(!pattern){
            pattern = this.P.DEFAULT_PATTERN;
        }

        var selection = CUI.rte.Selection.createProcessingSelection(context);
        var rteText = selection.startNode.data, initValue = { align : "LEFT", text : "" };

        if(rteText){
            //this parsing logic depends on pattern, so when you add new pattern for pullquote make
            //sure you modify the following code to suit your pattern
            try{
                var start = rteText.lastIndexOf("[pullquote:", selection.startOffset);

                if( start !== -1 ){
                    var dIndex = rteText.indexOf(",");
                    initValue.align = rteText.substring(rteText.indexOf("=",start) + 1, dIndex);
                    initValue.text = rteText.substring(rteText.indexOf("=", dIndex) + 1, rteText.indexOf(")]"));
                }
            }catch(err){
                CQ.Ext.Msg.alert("Error","Error parsing text with pattern : " + pattern);
            }
        }

        var dialogConfig = {
            "jcr:primaryType": "cq:Dialog",
            title: "Pull Quote",
            modal: true,
            width: 600,
            height: 400,
            items: [ {
                xtype: "panel",
                layout: "fit",
                padding: "20px 0 0 10px",
                items: [ {
                    xtype: "panel",
                    layout: "form",
                    border: false,
                    items: [ {
                        xtype: 'radiogroup',
                        columns: 4,
                        fieldLabel: "Align",
                        items: [{
                            boxLabel: ' Left',
                            name: 'align',
                            value: 'LEFT',
                            checked: (initValue.align === "LEFT")
                        }, {
                            name: 'align',
                            boxLabel: ' Right',
                            value: 'RIGHT',
                            checked: (initValue.align === "RIGHT")
                        }, {
                            name: 'align',
                            boxLabel: ' Center',
                            value: 'CENTER',
                            checked: (initValue.align === "CENTER")
                        }, {
                            name: 'align',
                            boxLabel: ' Justify',
                            value: 'JUSTIFY',
                            checked: (initValue.align === "JUSTIFY")
                        }]
                    },{
                        xtype: "textarea",
                        height: 250,
                        name: "text",
                        fieldLabel: "Text",
                        fieldDescription: "Enter quote text",
                        anchor: "90%",
                        value: initValue.text
                    } ]
                } ]
            } ],
            ok: function() {
                var tBox = this.findByType("textarea")[0];
                var rBox = this.findByType("radiogroup")[0];

                if(!tBox.getValue()){
                    CQ.Ext.Msg.alert("Error","Enter text for quote");
                    return;
                }

                var value = {
                    text: tBox.getValue(),
                    align: rBox.getValue().value,
                    pattern: pattern
                };

                this.close();
                editorKernel.relayCmd(MyClientLib.PullQuote.ADD_QUOTE_CMD, value);
            },
            listeners: {
                show: function() {
                    editorKernel.fireUIEvent("dialogshow");
                },
                hide: function() {
                    editorKernel.fireUIEvent("dialoghide");
                }
            }
        };

        dm.show(CQ.WCM.getDialog(dialogConfig));
    },

    notifyPluginConfig: function(pluginConfig) {
        pluginConfig = pluginConfig || { };

        CUI.rte.Utils.applyDefaults(pluginConfig, {
            "tooltips": {
                "addquote": {
                    "title": "Add/Modify Pull Quote",
                    "text": "Add/Modify Pull Quote"
                },
                "removequote": {
                    "title": "Remove Pull Quote",
                    "text": "Remove Pull Quote"
                }
            }
        });

        this.config = pluginConfig;
    },

    updateState: function(selDef) {
        var rteText = selDef.selection.startNode.data;

        //this parsing logic depends on pattern, so when you add new pattern for pullquote make
        //sure you modify the following code to suit your pattern
        if(rteText && (rteText.lastIndexOf("[pullquote:", selDef.startOffset) !== -1)){
            this.removeQuoteUI.setDisabled(false);
        }else{
            this.removeQuoteUI.setDisabled(true);
        }

        this.addQuoteUI.setSelected(false);
        this.removeQuoteUI.setSelected(false);
    }
});

CUI.rte.plugins.PluginRegistry.register("pullquote", MyClientLib.PullQuote.Plugin);

MyClientLib.PullQuote.Cmd = new Class({
    toString: "PullQuote",
    extend: CUI.rte.commands.Command,

    P: MyClientLib.PullQuote,

    isCommand: function(cmdStr) {
        return (cmdStr == this.P.ADD_QUOTE_CMD) || (cmdStr == this.P.REMOVE_QUOTE_CMD);
    },

    getProcessingOptions: function() {
        var cmd = CUI.rte.commands.Command;
        return cmd.PO_SELECTION | cmd.PO_NODELIST;
    },

    addPullQuote: function(execDef){
        var value = execDef.value, selection = execDef.selection;
        var node = CUI.rte.DomProcessor.createNode(execDef.editContext, "span");

        var rteText = selection.startNode.data;
        var start = rteText ? rteText.lastIndexOf("[pullquote:", selection.startOffset) : -1;

        if( start !== -1 ){
            CUI.rte.Common.insertNode(node, selection.startNode, start);
            selection.startNode.parentNode.removeChild(selection.startNode);
        }else{
            CUI.rte.Common.insertNode(node, selection.startNode, selection.startOffset);
        }

        if(value.pattern){
            node.innerHTML = value.pattern.replace("<align>", value.align).replace("<text>", value.text);
        }else{
            node.innerHTML = "[pullquote:(align=\"" + value.align + "\",text=\"" + value.text + "\")]";
        }
    },

    removePullQuote: function(execDef){
        var selection = execDef.selection;

        var rteText = selection.startNode.data;
        var start = rteText.lastIndexOf("[pullquote:", selection.startOffset);

        if( start !== -1 ){
            selection.startNode.parentNode.removeChild(selection.startNode);
        }
    },

    execute: function(execDef) {
        if(execDef.command == this.P.ADD_QUOTE_CMD){
            this.addPullQuote(execDef);
        }else{
            this.removePullQuote(execDef);
        }
    }
});

CUI.rte.commands.CommandRegistry.register("pullquote", MyClientLib.PullQuote.Cmd);
