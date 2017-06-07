/**
 * @class ExperienceAEM.ImageMultiField.MultiField
 * @extends CQ.form.MultiField
 * <p>ImageMultiField widget for adding unlimited number of CQ.html5.form.SmartImage widgets in a component dialog </p>
 * <code>Sample configuration
 * <basic
 *     jcr:primaryType="cq:Widget"
 *     title="Images"
 *     xtype="panel">
 *     <items jcr:primaryType="cq:WidgetCollection">
 *          <images
 *              jcr:primaryType="cq:Widget"
 *              border="false"
 *              hideLabel="true"
 *              name="./images"
 *              xtype="imagemultifield">
 *              <fieldConfig
 *                  jcr:primaryType="cq:Widget"
 *                  border="false"
 *                  hideLabel="true"
 *                  layout="form"
 *                  padding="10px 0 0 100px"
 *                  xtype="imagemultifieldpanel">
 *                  <items jcr:primaryType="cq:WidgetCollection">
 *                          <image
 *                          jcr:primaryType="cq:Widget"
 *                          cropParameter="./imageCrop"
 *                          ddGroups="[media]"
 *                          fileNameParameter="./imageName"
 *                          fileReferenceParameter="./imageReference"
 *                          height="250"
 *                          mapParameter="./imageMap"
 *                          imageSlingResourceType="/libs/foundation/components/logo"
 *                          name="./image"
 *                          rotateParameter="./imageRotate"
 *                          sizeLimit="100"
 *                          xtype="imagemultifieldsmartimage"/>
 *                  </items>
 *              </fieldConfig>
 *          </images>
 *     </items>
 * </basic>
 * </code>
 * @constructor
 * Creates a new ImageMultiField.MultiField.
 * @param {Object} config The config object
 **/
CQ.Ext.ns("ExperienceAEM.ImageMultiField");

ExperienceAEM.ImageMultiField.Panel = CQ.Ext.extend(CQ.Ext.Panel, {
    initComponent: function () {
        ExperienceAEM.ImageMultiField.Panel.superclass.initComponent.call(this);

        var multifield = this.findParentByType('imagemultifield'),itemName,
            changeParams = ["cropParameter", "fileNameParameter","fileReferenceParameter",
                "mapParameter","rotateParameter" ];

        var images = this.find('xtype', 'imagemultifieldsmartimage');

        multifield.nextPanelNum = multifield.nextPanelNum + 1;

        var panelName = this.name = this.name + "/" + multifield.nextPanelNum;

        CQ.Ext.each(this.items.items, function(item){
            if("imagemultifieldsmartimage" == item.xtype){ //skip the imagemultifieldsmartimage we'll handle it later
                return;
            }

            itemName = item.name ? item.name : item.id;
            item.name = panelName + "/" + ( itemName.indexOf("./") === 0 ? itemName.substr(2) : itemName ) ;
        });

        CQ.Ext.each(images, function(image){
            var imageName = image.name;

            if(imageName.indexOf("./") === 0) {
                imageName = imageName.substr(2); //get rid of ./
            }

            imageName = panelName + "/" + imageName;

            image.name = imageName;

            CQ.Ext.each(changeParams, function(cItem){
                if(image[cItem]){
                    image[cItem] = imageName + "/" +
                        ( image[cItem].indexOf("./") === 0 ? image[cItem].substr(2) : image[cItem]);
                }
            });

            CQ.Ext.each(image.imageToolDefs, function(toolDef){
                toolDef.transferFieldName = imageName + toolDef.transferFieldName.substr(1);
                toolDef.transferField.name = toolDef.transferFieldName;
            });

            this.add(new CQ.Ext.form.Hidden({
                name: image.name + "/sling:resourceType",
                value: image.imageSlingResourceType
            }));
        }, this);
    },

    setValue: function (record) {
        var multifield = this.findParentByType('imagemultifield'), value,
            x, fileRefParam, imagePath, recCopy, imgRec;

        var images = this.find('xtype', 'imagemultifieldsmartimage');
        var panelRec = record.get(this.name);

        if(panelRec){
            CQ.Ext.each(this.items.items, function(item){
                if("imagemultifieldsmartimage" == item.xtype){
                    return;
                }

                value = panelRec[item.name.substr(item.name.lastIndexOf("/") + 1)];

                if(value){
                    item.setValue(value);
                }
            });
        }

        CQ.Ext.each(images, function(image){
            imagePath = multifield.path + "/" + image.name;
            recCopy = CQ.Util.copyObject(record);
            imgRec = recCopy.get(image.name);

            for(x in imgRec){
                if(imgRec.hasOwnProperty(x)){
                    recCopy.data[x] = imgRec[x];
                }
            }

            recCopy.data[multifield.name.substr(2)] = undefined;

            fileRefParam = image.fileReferenceParameter;
            image.fileReferenceParameter = fileRefParam.substr(fileRefParam.lastIndexOf("/") + 1);

            image.processRecord(recCopy, imagePath);
            image.fileReferenceParameter = fileRefParam;
        }, this);
    },

    validate: function(){
        return true;
    },

    getName: function(){
        return this.name;
    }
});

CQ.Ext.reg("imagemultifieldpanel", ExperienceAEM.ImageMultiField.Panel);

ExperienceAEM.ImageMultiField.SmartImage = CQ.Ext.extend(CQ.html5.form.SmartImage, {
    syncFormElements: function() {
        if(!this.fileNameField.getEl().dom){
            return;
        }

        ExperienceAEM.ImageMultiField.SmartImage.superclass.syncFormElements.call(this);

        if (this.moveParameter) {
            this.moveParameter.getEl().dom.name = this.name + CQ.Sling.MOVE_SUFFIX;
        }
    },

    afterRender: function() {
        ExperienceAEM.ImageMultiField.SmartImage.superclass.afterRender.call(this);

        var dialog = this.findParentByType('dialog'),
            target = this.dropTargets[0], multifield, dialogZIndex;

        if (dialog && dialog.el && target.highlight) {
            dialogZIndex = parseInt(dialog.el.getStyle("z-index"), 10);

            if (!isNaN(dialogZIndex)) {
                target.highlight.zIndex = dialogZIndex + 1;
            }
        }

        target.parentMultiFieldItem = this.findParentByType("multifielditem");

        multifield = this.findParentByType('multifield');
        multifield.dropTargets.push(target);

        this.dropTargets = undefined;
    },

    onFileSelected: function(uploadField, files) {
        var imageName = this.name;
        this.name = "./" + this.name.substring(this.name.lastIndexOf("/") + 1);
        ExperienceAEM.ImageMultiField.SmartImage.superclass.onFileSelected.call(this, uploadField, files);
        this.name = imageName;
    }
});

CQ.Ext.reg('imagemultifieldsmartimage', ExperienceAEM.ImageMultiField.SmartImage);

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

        if (iniValue === null) {
            iniValue = "";
        }

        this.initialValue = iniValue;
    }
});

CQ.Ext.override(CQ.form.MultiField.Item, {
    reorder: function(item) {
        if(item.field && item.field.xtype === "imagemultifieldpanel"){
            var c = this.ownerCt, iIndex = c.items.indexOf(item), tIndex = c.items.indexOf(this);

            if(iIndex < tIndex){ //user clicked up
                c.insert(c.items.indexOf(item), this);
                this.getEl().insertBefore(item.getEl());
            }else{//user clicked down
                c.insert(c.items.indexOf(this), item);
                this.getEl().insertAfter(item.getEl());
            }

            c.doLayout();
        }else{
            item.field.setValue(this.field.getValue());
            this.field.setValue(item.field.getValue());
        }
    }
});

ExperienceAEM.ImageMultiField.MultiField = CQ.Ext.extend(CQ.form.MultiField , {
    Record: CQ.data.SlingRecord.create([]),
    nextPanelNum: 0,

    initComponent: function() {
        ExperienceAEM.ImageMultiField.MultiField.superclass.initComponent.call(this);

        var dialog = this.findParentByType('dialog');

        dialog.on('beforesubmit', function(){
            var panelsInOrder = this.find('xtype','imagemultifieldpanel'),
                order = [];

            CQ.Ext.each(panelsInOrder , function(panel){
                order.push(panel.name.substr(panel.name.lastIndexOf("/") + 1));
            });

            $('<input />').attr('type', 'hidden')
                .attr('name', this.getName() + "/order")
                .attr('value', JSON.stringify(order) )
                .appendTo($(dialog.form.el.dom));
        },this);

        this.dropTargets = [];

        this.on("removeditem", function(pPanel){
            resetDropTargets.call(this, pPanel);
        });

        var resetDropTargets = function(pPanel){
            var dropTargets = [];

            var itemFields = pPanel.findByType("multifielditem");

            if(_.isEmpty(itemFields)){
                return;
            }

            var itemFieldsIds = _.pluck(itemFields, "id");

            CQ.Ext.each(this.dropTargets, function(dTarget){
                if(_.contains(itemFieldsIds, dTarget.parentMultiFieldItem.id)){
                    dropTargets.push(dTarget);
                }
            }, this);

            this.dropTargets = dropTargets;
        }
    },

    addItem: function(value){
        if(!value){
            value = new this.Record({},{});
        }
        ExperienceAEM.ImageMultiField.MultiField.superclass.addItem.call(this, value);
    },

    processRecord: function(record, path) {
        if (this.fireEvent('beforeloadcontent', this, record, path) !== false) {
            this.items.each(function(item) {
                if(item.field && item.field.xtype === "imagemultifieldpanel"){
                    this.remove(item, true);
                }
            }, this);

            var panels = record.get(this.getName()), oName, oValue, iNames;
            this.nextPanelNum = 0;

            if (panels) {
                oName = this.getName() + "/order";
                oValue = record.get(oName) ? record.get(oName) : "";
                iNames = JSON.parse(oValue);

                CQ.Ext.each(iNames, function(iName){
                    this.nextPanelNum = parseInt(iName, 10) - 1;
                    this.addItem(record);
                }, this);
            }

            this.fireEvent('loadcontent', this, record, path);
        }
    }
});

CQ.Ext.reg('imagemultifield', ExperienceAEM.ImageMultiField.MultiField);

