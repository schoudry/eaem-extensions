CQ.Ext.ns("MyComponents");

MyComponents.ContentFinder = {
    TAB_PAGES : "cfTab-Pages",
    PAGES_QUERY_BOX : "cfTab-Pages-QueryBox",
    CONTENT_FINDER_TAB: 'contentfindertab',
    FULL_TEXT_HIDDEN: "cfTab-Pages-fullText",

    getTemplatesCombo: function(){
        var store = new CQ.Ext.data.Store({
            proxy: new CQ.Ext.data.HttpProxy({
                "autoLoad":false,
                url: "/bin/mycomponents/objectfinder/templates",
                method: 'GET'
            }),
            reader: new CQ.Ext.data.JsonReader({
                root: 'data',
                fields: [
                    {name: 'id', mapping: 'id'},
                    {name: 'name', mapping: 'name'}
                ]
            })
        });

        var combo = {
            store: store,
            hiddenName: "template",
            xtype : "combo",
            "width": "185",
            style: "margin-top:0",
            mode: "remote",
            triggerAction: "all",
            valueField: 'id',
            displayField: 'name',
            emptyText: 'Select or Start Typing',
            minChars: 2
        };

        return combo;
    },

    addPageFilters: function(){
        var tab = CQ.Ext.getCmp(this.TAB_PAGES);
        var queryBox = CQ.Ext.getCmp(this.PAGES_QUERY_BOX);

        queryBox.add({
            id: this.FULL_TEXT_HIDDEN,
            "xtype": "hidden",
            name: "fullText",
            hiddenName: "fullText",
            value: "true"
        });

        var ftHidden = CQ.Ext.getCmp(this.FULL_TEXT_HIDDEN);

        queryBox.add({
            xtype: 'radiogroup',
            style: "margin:10px 0 0 0",
            columns: 1,
            vertical: true,
            items: [{
                boxLabel: ' Full Text',
                name: 'fullTextRB',
                inputValue: '0',
                checked: true
            }, {
                name: 'fullTextRB',
                boxLabel: ' Title',
                inputValue: '1',
                listeners: {
                    'check' : function(c){
                        ftHidden.setValue(!c.checked);
                    }
                }
            }]
        });

        queryBox.add({
            "xtype": "label",
            "text": "Select Path",
            "cls": "x-form-field x-form-item-label"
        });

        var pathField = {
            "xtype": "pathfield",
            "width": "100%",
            "style" : "margin-top: 0px;",
            hiddenName: "path"
        };

        queryBox.add(pathField);

        queryBox.add({
            "xtype": "label",
            "text": "Select Template",
            style: "margin:10px 0 0 0",
            "cls": "x-form-field x-form-item-label"
        });

        queryBox.add(this.getTemplatesCombo());

        var cfTab = queryBox.findParentByType(this.CONTENT_FINDER_TAB);

        queryBox.add(new CQ.Ext.Panel({
            border: false,
            height: 40,
            items: [{
                xtype: 'panel',
                border: false,
                style: "margin:10px 0 0 0",
                layout: {
                    type: 'hbox'
                },
                items: [{
                    xtype: "button",
                    text: "Search",
                    width: 60,
                    tooltip: 'Search',
                    handler: function (button) {
                        var params = cfTab.getParams(cfTab);
                        cfTab.loadStore(params);
                    }
                },{
                    baseCls: "non-existent",
                    html:"<span style='margin-left: 10px;'></span>"
                },{
                    xtype: "button",
                    text: "Clear",
                    width: 60,
                    tooltip: 'Clear the filters',
                    handler: function (button) {
                        $.each(cfTab.fields, function(key, field){
                            field[0].setValue("");
                        });
                    }
                }
                ]
            }]
        }));

        queryBox.setHeight(230);
        queryBox.doLayout();

        var form = cfTab.findByType("form")[0];
        cfTab.fields = CQ.Util.findFormFields(form);
    },

    changeResultsStore: function(){
        var queryBox = CQ.Ext.getCmp(this.PAGES_QUERY_BOX);
        var resultsView = queryBox.ownerCt.findByType("dataview");

        var rvStore = resultsView[0].store;
        rvStore.proxy = new CQ.Ext.data.HttpProxy({
            url: "/bin/mycomponents/objectfinder/pageresults.json",
            method: 'GET'
        });
    }
};

(function(){
    var INTERVAL = setInterval(function(){
        var c = MyComponents.ContentFinder;
        var tabPanel = CQ.Ext.getCmp(CQ.wcm.ContentFinder.TABPANEL_ID);

        if(tabPanel){
            clearInterval(INTERVAL);
            c.addPageFilters();
            c.changeResultsStore();
        }
    }, 250);
})();

