(function(){
    if (typeof window.ExperienceAEM == "undefined") {
        window.ExperienceAEM = {};
    }

    ExperienceAEM.showMouseCoordinates = function(image){
        if(!image || !image.imagePanel || !image.imageToolDefs){
            return;
        }

        var imgTools = image.imageToolDefs,
            mapTool, imageOffsets = image.imagePanel.imageOffsets;

        for(var x = 0; x < imgTools.length; x++){
            if(imgTools[x].toolId == 'smartimageMap'){
                mapTool = imgTools[x];
                break;
            }
        }

        var mapCoords = mapTool.userInterface.findBy(function(comp){
            return comp["itemId"] == "areaDefCoords";
        })[0];

        var coords = new CQ.Ext.form.TextField({
            fieldLabel: "Mouse"
        });

        mapCoords.ownerCt.add(coords);
        mapCoords.ownerCt.doLayout();

        var $img = $(image.imagePanel.el.dom).find("img");

        $img.mousemove(function(event) {
            var offset = $(this).offset(),
                relX = (event.pageX - offset.left),
                relY = (event.pageY - offset.top);

            relX = relX - imageOffsets.x;
            relY = relY - imageOffsets.y;

            coords.setValue("(" + relX + "/" + relY + ")");
        });
    }
}());