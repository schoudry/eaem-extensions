CQ.Ext.ns("MyClientLib");

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

MyClientLib.InboxSmartImage = CQ.Ext.extend(CQ.html5.form.SmartImage, {
    Record:  CQ.data.SlingRecord.create([]),

    constructor: function(config) {
        config = config || {};
        config.fileReferenceParameter = "imageReference";
        config.name = "placeHolder";
        MyClientLib.InboxSmartImage.superclass.constructor.call(this,config);
    },

    clearInvalid: function() {
        if(!this.uploadPanel || !this.uploadPanel.body) {
            return;
        }

        MyClientLib.InboxSmartImage.superclass.clearInvalid.call(this);
    },

    afterRender: function() {
        MyClientLib.InboxSmartImage.superclass.afterRender.call(this);

        var dialog = this.findParentByType('dialog');
        dialog.setSize(900,550);

        var imageAdded = false;

        dialog.on('afterlayout', function(){
            if(!imageAdded){
                var rec = new this.Record({},{});

                var inbox = CQ.Ext.getCmp(CQ.workflow.Inbox.List.ID);
                var imagePath = inbox.getSelectionModel().getSelections()[0];
                imagePath = imagePath.data.payloadPath;

                rec.data["imageReference"] = imagePath;
                this.processRecord(rec);

                imageAdded = true;
            }
        },this);
    }
});

CQ.Ext.reg('inboxsmartimage', MyClientLib.InboxSmartImage);
