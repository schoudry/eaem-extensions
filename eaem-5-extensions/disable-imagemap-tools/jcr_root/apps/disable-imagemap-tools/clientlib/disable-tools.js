CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.Html5SmartImage = {
    mapToolRectangleOnly: function(image){
        var mapTool = null;

        CQ.Ext.each(image.imageToolDefs, function(tool){
            if(tool.toolId == "smartimageMap"){
                mapTool = tool;
            }
        });

        var toolBar = mapTool.userInterface.getTopToolbar();

        var tools = toolBar.findBy(function(comp){
            return comp["toggleGroup"] == "mapperTools";
        }, toolBar);

        CQ.Ext.each(tools, function(tool){
            if( (tool.text != "Rectangle") && (tool.text != "Edit") ){
                tool.setDisabled(true);
            }
        });
    }
};
