CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.Html5SmartImage = CQ.Ext.extend(CQ.html5.form.SmartImage, {
    initComponent: function () {
        ExperienceAEM.Html5SmartImage.superclass.initComponent.call(this);
        var mapTool = null;

        CQ.Ext.each(this.imageToolDefs, function(tool){
            if(tool.toolId == "smartimageMap"){
                mapTool = tool;
            }
        });

        var mapValue = null;

        this.on("loadimage", function(){
            if(mapTool.initialValue){
                mapValue = mapTool.initialValue;
            }else if(!mapTool.initialValue && mapValue){
                mapTool.initialValue = mapValue;
            }
        });
    }
});

CQ.Ext.reg("savemapshtml5smartimage", ExperienceAEM.Html5SmartImage);