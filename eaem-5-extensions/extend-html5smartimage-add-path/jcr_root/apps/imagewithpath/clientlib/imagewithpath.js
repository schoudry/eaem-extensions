CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.SmartImage = CQ.Ext.extend(CQ.html5.form.SmartImage, {
    syncFormElements: function() {
        if(!this.fileNameField.getEl().dom){
            return;
        }

        ExperienceAEM.SmartImage.superclass.syncFormElements.call(this);
    } ,

    afterRender: function() {
        ExperienceAEM.SmartImage.superclass.afterRender.call(this);

        var dialog = this.findParentByType('dialog');
        var target = this.dropTargets[0];

        if (dialog && dialog.el && target.highlight) {
            var dialogZIndex = parseInt(dialog.el.getStyle("z-index"), 10);

            if (!isNaN(dialogZIndex)) {
                target.highlight.zIndex = dialogZIndex + 1;
            }
        }

        var panel = this.findParentByType('panel');
        debugger;
        panel.dropTargets = [ target ];

        this.dropTargets = undefined;
    }
});

ExperienceAEM.SmartImageWithPath = CQ.Ext.extend(CQ.Ext.Panel, {
    constructor: function(config){
        this.imageConfig = config;
        ExperienceAEM.SmartImageWithPath.superclass.constructor.call(this, config);
    },

    initComponent: function() {
        ExperienceAEM.SmartImageWithPath.superclass.initComponent.call(this);

        var pathField = {
            xtype: "pathfield",
            fieldLabel: "Select Path",
            style: "margin-bottom: 15px;",
            rootPath: "/content",
            listeners: {
                dialogclose: {
                    fn: function(){
                    }
                }
            }
        };

        this.add(pathField);

        var imageField = new ExperienceAEM.SmartImage(this.imageConfig);

        this.add(imageField);
    }
});

CQ.Ext.reg('smartimagewithpath', ExperienceAEM.SmartImageWithPath);