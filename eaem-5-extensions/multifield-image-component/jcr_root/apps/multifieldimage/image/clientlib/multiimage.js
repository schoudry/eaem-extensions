var MyClientLib = MyClientLib || {};

CQ.Ext.override(CQ.html5.form.SmartImage, {
    syncFormElements: function() {
        if(!this.fileNameField.getEl().dom){
            return;
        }

        CQ.html5.form.SmartImage.superclass.syncFormElements.call(this);

        var toolCnt = this.imageToolDefs.length;

        for (var toolIndex = 0; toolIndex < toolCnt; toolIndex++) {
            var toolToProcess = this.imageToolDefs[toolIndex];
            toolToProcess.transferToField();
        }
    } ,

    processRecord: function(record, path){
        CQ.html5.form.SmartImage.superclass.processRecord.call(this,record, path);
        var imagePanel = this.ownerCt;

        if(record.data[imagePanel.imageConfig.parentName]){
            imagePanel.setVisible(true);

            var widget = imagePanel.ownerCt;

            if(widget.imagePanels[0] == imagePanel){
                return;
            }

            var poolPanels = widget.poolPanels;

            widget.poolPanels = poolPanels.splice(1, poolPanels.length );
            widget.imagePanels.push(imagePanel);
        }
    }
});

MyClientLib.MultiImageWidget = CQ.Ext.extend(CQ.Ext.Panel, {
    BASE_ID : 'MultiImageWidgetPanel',
    imagePanels: [],
    poolPanels: [],

    constructor: function(config){
        config = config || {};

        var defaults = { "layout" : "form", border: false };
        config = CQ.Util.applyDefaults(config, defaults);

        MyClientLib.MultiImageWidget.superclass.constructor.call(this, config);
    },

    getImageConfig: function(suffix){
        var config = CQ.Util.copyObject(this.imageConfig);

        config.id = this.BASE_ID + "-" + suffix;

        var parentPrefix = config.parentPrefix;

        if(!parentPrefix){
            parentPrefix = "demo";
        }

        parentPrefix = parentPrefix + "-" + suffix;
        config.parentName = parentPrefix;

        var changeParams = ["cropParameter", "fileNameParameter","fileReferenceParameter","mapParameter","rotateParameter","name"];

        CQ.Ext.each(changeParams, function(cItem){
            config[cItem] = "./" + parentPrefix + "/" + config[cItem];
        });

        config.xtype = "html5smartimage";

        return config;
    },

    initComponent: function () {
        MyClientLib.MultiImageWidget.superclass.initComponent.call(this);

        var imagePoolMax = this.imagePoolMax;

        if(!imagePoolMax){
            this.imagePoolMax = 10;
        }

        var suffix = 1;

        var image = new MyClientLib.MultiImage({imageConfig : this.getImageConfig(suffix++)});
        this.imagePanels.push(image);
        this.add(image);

        var pooledImage;

        for(var i = 0; i < this.imagePoolMax - 1; i++){
            pooledImage = new MyClientLib.MultiImage({imageConfig : this.getImageConfig(suffix++)});
            pooledImage.setVisible(false);

            this.poolPanels.push(pooledImage);
            this.add(pooledImage);
        }

        var dialog = this.findParentByType('dialog');
        var widget = this;

        dialog.on('beforesubmit', function(){
            CQ.Ext.each(this.poolPanels, function(i){
                widget.remove(i, true);
            });
        },this);
    },

    setValue: function (value) {
    }
});

CQ.Ext.reg("multiimagewidget", MyClientLib.MultiImageWidget);

MyClientLib.MultiImage = CQ.Ext.extend(CQ.Ext.Panel, {
    imageConfig: '',
    style: "margin-bottom: 10px",

    tools: [{
        id: "plus",
        handler: function(e, toolEl, panel, tc){
            var widget = panel.ownerCt;
            var poolPanels = widget.poolPanels;

            var image = poolPanels[0];
            image.setVisible(true);

            widget.poolPanels = poolPanels.splice(1, poolPanels.length );
            widget.imagePanels.push(image);
        }
    },{
        id: "toggle",
        handler: function(e, toolEl, panel, tc){
            alert("Reorder up is a work in progress, and the icon is different as the .x-tool-top is not available in cq css")
        }
    },{
        id: "down",
        handler: function(e, toolEl, panel, tc){
            alert("Reorder down is a work in progress")
        }
    },{
        id: "minus",
        handler: function(e, toolEl, panel, tc){
            var widget = panel.ownerCt;

            var image = panel.find('xtype', 'html5smartimage')[0];
            var path = image.dataPath + "/" + panel.imageConfig.parentName;

            $.ajax({
                url: path,
                dataType: "json",
                type: 'DELETE',
                success: function(data){

                }
            });

            widget.remove(panel, true);
        }
    }],

    constructor: function(config){
        config = config || {};

        MyClientLib.MultiImage.superclass.constructor.call(this, config);
    },

    initComponent: function () {
        MyClientLib.MultiImage.superclass.initComponent.call(this);

        var config = this.imageConfig;
        this.add(config);
    },

    validate: function(){
        return true;
    },

    getName: function(){
        return this.name;
    }
});

CQ.Ext.reg("multiimagepanel", MyClientLib.MultiImage);