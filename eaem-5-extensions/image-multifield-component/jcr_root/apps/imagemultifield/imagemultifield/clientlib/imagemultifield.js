CQ.Ext.ns("ImageMultiField");

ImageMultiField.Panel = CQ.Ext.extend(CQ.Ext.Panel, {
    initComponent: function () {
        ImageMultiField.Panel.superclass.initComponent.call(this);

        var multifield = this.findParentByType('imagemultifield');
        var image = this.find('xtype', 'imagemultifieldsmartimage')[0];

        var imageName = multifield.nextImageName;

        if(!imageName){
            imageName = image.name;

            if(!imageName){
                imageName = "demo";
            }else if(imageName.indexOf("./") == 0){
                imageName = imageName.substr(2); //get rid of ./
            }

            var suffix = multifield.nextImageNum = multifield.nextImageNum + 1;
            imageName = this.name + "/" + imageName + "-" + suffix;
        }

        image.name = imageName;

        var changeParams = ["cropParameter", "fileNameParameter","fileReferenceParameter",
                                "mapParameter","rotateParameter" ];

        CQ.Ext.each(changeParams, function(cItem){
            if(image[cItem]){
                image[cItem] = imageName + "/" +
                    ( image[cItem].indexOf("./") == 0 ? image[cItem].substr(2) : image[cItem]);
            }
        });

        CQ.Ext.each(image.imageToolDefs, function(toolDef){
            toolDef.transferFieldName = imageName + toolDef.transferFieldName.substr(1);
            toolDef.transferField.name = toolDef.transferFieldName;
        });
    },

    setValue: function (record) {
        var multifield = this.findParentByType('imagemultifield');
        var image = this.find('xtype', 'imagemultifieldsmartimage')[0];

        var recCopy = CQ.Util.copyObject(record);

        var imagePath = multifield.path + "/" + image.name;
        var imgRec = recCopy.get(image.name);

        for(var x in imgRec){
            if(imgRec.hasOwnProperty(x)){
                recCopy.data[x] = imgRec[x];
            }
        }

        recCopy.data[this.name.substr(2)] = undefined;

        var fileRefParam = image.fileReferenceParameter;
        image.fileReferenceParameter = fileRefParam.substr(fileRefParam.lastIndexOf("/") + 1);

        image.processRecord(recCopy, imagePath);
        image.fileReferenceParameter = fileRefParam;
    },

    validate: function(){
        return true;
    }
});

CQ.Ext.reg("imagemultifieldpanel", ImageMultiField.Panel);

ImageMultiField.SmartImage = CQ.Ext.extend(CQ.html5.form.SmartImage, {
    syncFormElements: function() {
        if(!this.fileNameField.getEl().dom){
            return;
        }

        ImageMultiField.SmartImage.superclass.syncFormElements.call(this);
    } ,

    afterRender: function() {
        ImageMultiField.SmartImage.superclass.afterRender.call(this);

        var dialog = this.findParentByType('dialog');
        var target = this.dropTargets[0];

        if (dialog && dialog.el && target.highlight) {
            var dialogZIndex = parseInt(dialog.el.getStyle("z-index"), 10);

            if (!isNaN(dialogZIndex)) {
                target.highlight.zIndex = dialogZIndex + 1;
            }
        }

        var multifield = this.findParentByType('multifield');
        multifield.dropTargets.push(target);

        this.dropTargets = undefined;
    }
});

CQ.Ext.reg('imagemultifieldsmartimage', ImageMultiField.SmartImage);

CQ.Ext.override(CQ.form.SmartImage.ImagePanel, {
    addCanvasClass: function(clazz) {
        var imageCanvas = CQ.Ext.get(this.imageCanvas);

        if(imageCanvas){
            imageCanvas.addClass(clazz);
        }
    },

    removeCanvasClass: function(clazz) {
        var imageCanvas = CQ.Ext.get(this.imageCanvas);

        if(imageCanvas){
            imageCanvas.removeClass(clazz);
        }
    }
});

CQ.Ext.override(CQ.form.SmartImage.Tool, {
    processRecord: function(record) {
        var iniValue = record.get(this.transferFieldName);

        if(!iniValue && ( this.transferFieldName.indexOf("/") !== -1 )){
            iniValue = record.get(this.transferFieldName.substr(this.transferFieldName.lastIndexOf("/") + 1));
        }

        if (iniValue == null) {
            iniValue = "";
        }

        this.initialValue = iniValue;
    }
});

CQ.Ext.override(CQ.form.MultiField.Item, {
    reorder: function(item) {
        if(item.field && item.field.xtype == "imagemultifieldpanel"){
            var c = this.ownerCt;
            var iIndex = c.items.indexOf(item);
            var tIndex = c.items.indexOf(this);

            if(iIndex < tIndex){ //user clicked up
                c.insert(c.items.indexOf(item), this);
                this.getEl().insertBefore(item.getEl());
            }else{//user clicked down
                c.insert(c.items.indexOf(this), item);
                this.getEl().insertAfter(item.getEl());
            }

            c.doLayout();
        }else{
            var value = item.field.getValue();
            item.field.setValue(this.field.getValue());
            this.field.setValue(value);
        }
    }
});

ImageMultiField.MultiField = CQ.Ext.extend(CQ.form.MultiField , {
    Record: CQ.data.SlingRecord.create([]),
    nextImageNum: 0,
    nextImageName: undefined,

    initComponent: function() {
        ImageMultiField.MultiField.superclass.initComponent.call(this);

        var imagesOrder = new CQ.Ext.form.Hidden({
            name: this.getName() + "/order"
        });

        this.add(imagesOrder);

        var dialog = this.findParentByType('dialog');

        dialog.on('beforesubmit', function(){
            var imagesInOrder = this.find('xtype','imagemultifieldsmartimage');
            var order = [];

            CQ.Ext.each(imagesInOrder , function(image){
                order.push(image.name.substr(image.name.lastIndexOf("/") + 1))
            });

            imagesOrder.setValue(JSON.stringify(order));
        },this);

        this.dropTargets = [];
    },

    addItem: function(value){
        if(!value){
            value = new this.Record({},{});
        }
        ImageMultiField.MultiField.superclass.addItem.call(this, value);
    },

    processRecord: function(record, path) {
        if (this.fireEvent('beforeloadcontent', this, record, path) !== false) {
            this.items.each(function(item) {
                if(item.field && item.field.xtype == "imagemultifieldpanel"){
                    this.remove(item, true);
                }
            }, this);

            var images = record.get(this.getName());
            this.nextImageNum = 0;

            if (images) {
                var oName = this.getName() + "/order";
                var oValue = record.get(oName) ? record.get(oName) : "";

                var iNames = JSON.parse(oValue);
                var highNum, val;

                CQ.Ext.each(iNames, function(iName){
                    val = parseInt(iName.substr(iName.indexOf("-") + 1));

                    if(!highNum || highNum < val){
                        highNum = val;
                    }

                    this.nextImageName = this.getName() + "/" + iName;
                    this.addItem(record);
                }, this);

                this.nextImageNum = highNum;
            }

            this.nextImageName = undefined;

            this.fireEvent('loadcontent', this, record, path);
        }
    }
});

CQ.Ext.reg('imagemultifield', ImageMultiField.MultiField);

