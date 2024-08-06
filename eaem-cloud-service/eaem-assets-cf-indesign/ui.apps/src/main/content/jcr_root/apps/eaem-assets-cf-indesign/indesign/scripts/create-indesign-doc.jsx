(function () {
    var returnObj = {}, aemHost, base64EncodedAEMCreds, resourcePath, document,
        aemUploadPath, contentJson;

    function createInDesignDoc() {
        var sourceFolder = getSourceFolder(),
            fileName = resourcePath.substring(resourcePath.lastIndexOf ('/') + 1),
            xmlFile = new File( sourceFolder.fullName + "/" + fileName + ".xml"),
            sourceFile = new File(sourceFolder.fullName + "/" + fileName);

        app.consoleout('Fetching resource from AEM: ' + aemHost + resourcePath + ' to ' + sourceFile);

        fetchResource (aemHost,  base64EncodedAEMCreds, resourcePath, sourceFile);

        var pdfOutputFile = new File(sourceFolder.fullName + "/" + fileName + '.pdf');

        app.consoleout('Started PDF export - ' + pdfOutputFile);

        app.consoleout('contentJson - ' + contentJson);

        returnObj.success = "completed";
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

    try{
        setParamsFromScriptArgs();

        //setTestParams();

        createInDesignDoc();
    }catch(err){
        returnObj.error = err;
        app.consoleout("Error processing document : " + resourcePath + ", error : " + err);
    }finally{
        if(document){
            document.close(SaveOptions.no);
        }
    }

    return JSON.stringify(returnObj);
}());
