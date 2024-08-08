(function () {
    var returnObj = {}, aemHost, base64EncodedAEMCreds, cfPath, contentJson;

    function createInDesignDoc() {
        cfPath = contentJson.path;

        var sourceFolder = getSourceFolder(),
            fileName = cfPath.substring(cfPath.lastIndexOf ('/') + 1),
            documentPath = new File(sourceFolder.fullName + "/" + fileName + '.indd'),
            pdfOutputFile = new File(sourceFolder.fullName + "/" + fileName + '.pdf');

        var document = app.documents.add();

        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences.changeTo = "$3";

        for(var eleName in contentJson){
            if(eleName == "path"){
                continue;
            }

            var spread = document.spreads.lastItem();
            var textFrame = createTextFrame(spread);
            textFrame.contents = contentJson[eleName];

            var tfFont = "Calibri";
            textFrame.parentStory.appliedFont = tfFont;

            app.changeGrepPreferences.appliedCharacterStyle = getBoldStyle(document, tfFont);

            app.findGrepPreferences.findWhat = "(<strong(\\s.*)?>)(.+?)(</strong(\\s.*)?>)";
            textFrame.changeGrep();

            app.findGrepPreferences.findWhat = "(<b(\\s.*)?>)(.+?)(</b(\\s.*)?>)";
            textFrame.changeGrep();
        }

        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;

        document.exportFile(ExportFormat.pdfType, pdfOutputFile);
        document.save(documentPath);

        returnObj.success = "completed";
    }

    function getBoldStyle(document, font) {
        var boldCharacterStyle = document.characterStyles.add();

        boldCharacterStyle.appliedFont = font;
        boldCharacterStyle.fontStyle = "Bold";
        //boldCharacterStyle.pointSize = 28;

        return boldCharacterStyle;
    }

    function createTextFrame(spread) {
        var textFrame = spread.textFrames.add();

        var y1 = 10; // upper left  Y-Coordinate
        var x1 = 10; // upper left  X-Coordinate
        var y2 = 50; // lower right Y-Coordinate
        var x2 = 40; // lower right X-Coordinate

        textFrame.geometricBounds = [y1, x1, y2, x2];

        return textFrame;
    }

    function getSourceFolder(){
        var today = new Date(),
            folderName = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate() + "-" + today.getHours()
                            + "-" + today.getMinutes() + "-" + today.getSeconds();

        var sourceFolder = new Folder(folderName);
        sourceFolder.create();

        return sourceFolder;
    }

    function setParamsFromScriptArgs(){
        if (app.scriptArgs.isDefined("base64EncodedAEMCreds")) {
            base64EncodedAEMCreds = app.scriptArgs.getValue("base64EncodedAEMCreds");
        } else {
            throw "AEM host credentials argument is missing";
        }

        if (app.scriptArgs.isDefined("aemHost")) {
            aemHost = app.scriptArgs.getValue("aemHost");
        } else {
            throw "aemHost argument is missing";
        }

        if (app.scriptArgs.isDefined("contentJson")) {
            contentJson = JSON.parse(app.scriptArgs.getValue("contentJson"));
            app.consoleout('contentJson: ' + app.scriptArgs.getValue("contentJson"));
        } else {
            throw "contentJson argument missing";
        }

        app.consoleout('base64EncodedAEMCreds --- ' + base64EncodedAEMCreds);
        app.consoleout('aemHost --- ' + aemHost);
    }

    function setTestParams(){
        aemHost = "localhost:4502";
        contentJson = {"rteText":"This is <b>bold</b>","path":"/content/dam/experience-aem/bold"}
    }

    try{
        //setParamsFromScriptArgs();

        setTestParams();

        createInDesignDoc();
    }catch(err){
        returnObj.error = err;
        //app.consoleout("Error processing content fragment : " + cfPath + ", error : " + err);
    }finally{
    }

    //return JSON.stringify(returnObj);
}());
