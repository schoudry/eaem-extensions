var MyClientLib = {
    dataUrl: ''
};

MyClientLib.FavoritesField = CQ.Ext.extend(CQ.form.CompositeField, {
    favText: null,
    favPath: null,
    fav: null,

    constructor: function(config){
        config = config || {};
        var defaults = { "labelWidth" : 150, "layout" : "form", border: true,
            padding: "10px", width: 500, boxMaxWidth : 520 };
        config = CQ.Util.applyDefaults(config, defaults);
        MyClientLib.FavoritesField.superclass.constructor.call(this, config);
    },

    initComponent: function () {
        MyClientLib.FavoritesField.superclass.initComponent.call(this);

        this.fav = new CQ.Ext.form.Hidden({
            name: this.name
        });

        this.add(this.fav);

        this.add(new CQ.Ext.form.Label({
            text: "Display Text"
        }));

        this.favText = new CQ.Ext.form.TextField({
            width: 300,
            allowBlank: true
        });

        this.add(this.favText);

        this.add(new CQ.Ext.form.Label({
            text: "Select Path"
        }));

        var handlerFn = function(thisObj, type){
            var treePanel = thisObj.treePanel;
            var path = thisObj.path;
            thisObj.treeLoader.dataUrl = MyClientLib.dataUrl + "?type=" + type;
            thisObj.treeLoader.load(thisObj.treePanel.root, function(){
                treePanel.selectPath(path);
            });
        }

        var buttons = [ new CQ.Ext.Button( { text: "All", width: 68, tooltip: 'Show all tree nodes', handler: function(){ handlerFn(this,'all'); }} ),
            new CQ.Ext.Button( { text: "Modify", width: 95, tooltip: 'Show nodes with modify permission only', handler: function(){ handlerFn(this,'write'); } } ),
            CQ.Dialog.OK, CQ.Dialog.CANCEL
        ];

        this.favPath = new CQ.form.PathField({
            treeLoader: new CQ.Ext.tree.TreeLoader({
                dataUrl:MyClientLib.dataUrl,
                requestMethod: "GET"
            }),
            browseDialogCfg: { "buttons" : buttons},
            allowBlank: false,
            width: 300,
            listeners: {
                dialogclose: {
                    fn: function(f){
                        var selNode = this.browseDialog.treePanel.getSelectionModel().getSelectedNode();
                        this.ownerCt.favText.setValue(selNode.text);
                    }
                }
            }
        });

        this.add(this.favPath);

        var dialog = this.findParentByType('dialog');

        dialog.on('beforesubmit', function(){
            var value = this.getValue();

            if(value){
                this.fav.setValue(value);
            }
        },this)
    },

    getValue: function () {
        if(this.favPath.el && this.favPath.el.dom){
            var link = {
                "url" : this.favPath.getValue(),
                "text" : this.favText.getValue()
            };

            return JSON.stringify(link);
        }

        return null;
    },

    setValue: function (value) {
        var link = JSON.parse(value);
        this.favText.setValue(link.text);
        this.favPath.setValue(link.url);
        this.fav.setValue(value);
    }
});

CQ.Ext.reg("myfavoritesfield", MyClientLib.FavoritesField);