(function () {
    if (typeof EAEM == "undefined") {
        EAEM = {
            COLUMNS_PER_SPREAD: 3,
            ROWS_PER_SPREAD: 2
        };
    }

    function collectionToArray(theCollection) {
        return (theCollection instanceof Array) ? theCollection.slice(0)
            : theCollection.everyItem().getElements().slice(0);
    }

    function getContainerAssetCount(spreadOrGroup){
        var pageItems = collectionToArray(spreadOrGroup.pageItems),
            count = 0;

        for (var pageItemIdx = 0; pageItemIdx < pageItems.length; pageItemIdx++) {
            var pageItem = pageItems[pageItemIdx];

            if (pageItem instanceof Group) {
                count = count + getContainerAssetCount(pageItem);
            }else {
                count++;
            }
        }

        return count;
    }

    function getPlaceSpread(document){
        var lastSpread = document.spreads.lastItem();

        var count = getContainerAssetCount(lastSpread),
            spread;

        if (count < (EAEM.COLUMNS_PER_SPREAD * EAEM.ROWS_PER_SPREAD)) {
            spread = lastSpread;
        }else{
            spread = document.spreads.add();
        }

        return spread;
    }

    function getNextGridPos(spread) {
        var gridPos = {
            row: 0,
            column: 0
        };

        var count = getContainerAssetCount(spread);

        if(count > 0){
            gridPos.row = Math.floor(count / EAEM.COLUMNS_PER_SPREAD);
            gridPos.column = count % EAEM.COLUMNS_PER_SPREAD;
        }

        return gridPos;
    }

    function createPageItem(spread) {
        var rect = spread.textFrames.add();

        var y1 = 0; // upper left  Y-Coordinate
        var x1 = 0; // upper left  X-Coordinate
        var y2 = 275; // lower right Y-Coordinate
        var x2 = 160; // lower right X-Coordinate

        rect.geometricBounds = [ y1 , x1 , y2 , x2 ];

        return rect;
    }

    function movePageItem(document, spread, gridPos, rect){
        var marginTop = document.marginPreferences.top;
        var marginBottom = document.marginPreferences.bottom;
        var marginLeft = document.marginPreferences.left;
        var marginRight = document.marginPreferences.right;

        var spreadLeftTop = spread.pages.firstItem().resolve(
            AnchorPoint.TOP_LEFT_ANCHOR, CoordinateSpaces.SPREAD_COORDINATES)[0];
        var spreadRightBottom = spread.pages.lastItem().resolve(
            AnchorPoint.BOTTOM_RIGHT_ANCHOR, CoordinateSpaces.SPREAD_COORDINATES)[0];

        var spreadWidth = spreadRightBottom[0] - spreadLeftTop[0] - marginLeft - marginRight;
        var spreadHeight = spreadRightBottom[1] - spreadLeftTop[1] - marginTop - marginBottom;

        var stepH = spreadWidth / EAEM.COLUMNS_PER_SPREAD;
        var stepV = spreadHeight / EAEM.ROWS_PER_SPREAD;

        var xPos = spreadLeftTop[0] + gridPos.column * stepH + marginLeft + 10;
        var yPos = spreadLeftTop[1] + gridPos.row * stepV + marginTop + 25;

        var rectTop = rect.resolve(AnchorPoint.TOP_LEFT_ANCHOR, CoordinateSpaces.SPREAD_COORDINATES)[0];

        var deltaX = xPos - rectTop[0];
        var deltaY = yPos - rectTop[1];

        rect.move(null,[deltaX, deltaY]);
    }

    function placeImage(rect, pdfPath){
        rect.contents = "";
        rect.contentType = ContentType.UNASSIGNED;
        rect.place(pdfPath);
        rect.fit(FitOptions.PROPORTIONALLY);
    }

    EAEM.placeAssets = function(commaSepPaths){
        var result = "ERROR", document,
            units = app.scriptPreferences.measurementUnit;

        try{
            app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;

            if(app.documents.length == 0){
                document = app.documents.add();
            }else{
                document = app.activeDocument;
            }

            var assetsArray = commaSepPaths.split(",");

            for(var i = 0; i < assetsArray.length; i++){
                var spread = getPlaceSpread(document);

                var gridPos = getNextGridPos(spread);

                var rect = createPageItem(spread);

                movePageItem(document, spread, gridPos, rect);

                placeImage(rect, assetsArray[i]);
            }

            result = "SUCCESS";
        }catch(err){
            result = "ERROR";
        }

        app.scriptPreferences.measurementUnit = units;

        return result;
    };

    EAEM.exportAsPDF = function(){
        var document, result = "ERROR";

        try{
            if(app.documents.length == 0){
                document = app.documents.add();
            }else{
                document = app.activeDocument;
            }

            var pdfPath = Folder.myDocuments.fsName.replace(/\\/g, '/') + "/eaem/" + document.name + ".pdf";

            document.exportFile(ExportFormat.pdfType, new File(pdfPath), false,
                        app.pdfExportPresets.item("[High Quality Print]"));

            result = pdfPath;
        }catch(err){
            result = "ERROR";
        }

        return result;
    };
})();
