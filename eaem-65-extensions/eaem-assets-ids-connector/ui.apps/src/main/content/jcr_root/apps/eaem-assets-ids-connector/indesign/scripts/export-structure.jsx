(function () {
    var returnObj = {}, aemHost, base64EncodedAEMCreds, resourcePath, document;

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

        if (app.scriptArgs.isDefined("resourcePath")) {
            resourcePath = app.scriptArgs.getValue("resourcePath");
        } else {
            throw "resourcePath argument missing";
        }

        app.consoleout('base64EncodedAEMCreds --- ' + base64EncodedAEMCreds);
        app.consoleout('aemHost --- ' + aemHost);
        app.consoleout('resourcePath --- ' + resourcePath);
    }

    function exportStructureJSON(){
        var sourceFolder = getSourceFolder(),
            fileName = resourcePath.substring(resourcePath.lastIndexOf ('/') + 1),
            xmlFile = new File( sourceFolder.fullName + "/" + fileName + ".xml"),
            sourceFile = new File(sourceFolder.fullName + "/" + fileName);

        app.consoleout('Fetching resource from AEM: ' + aemHost + resourcePath + ' to ' + sourceFile);

        fetchResource (aemHost,  base64EncodedAEMCreds, resourcePath, sourceFile);

        app.consoleout('Exporting structure for - ' + sourceFile);

        var document = app.open(sourceFile);

        document.exportFile(ExportFormat.xml, xmlFile);

        xmlFile.open('r');

        var xmlContent = xmlFile.read();

        xmlFile.close();

        var structureXML = new XML (xmlContent),
            structureJSON = [], parentPath,
            eles = structureXML.elements(), element, eleName;

        for(var x = 0 ; x < eles.length(); x++){
            element = eles.child(x);

            if(!parentPath){
                parentPath = "/" + element.parent().name() + "/";
            }

            structureJSON.push(parentPath + element.name());
        }

        return structureJSON;
    }

    function getSourceFolder(){
        var today = new Date(),
            folderName = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate() + "-" + today.getHours()
                + "-" + today.getMinutes() + "-" + today.getSeconds();

        var sourceFolder = new Folder(folderName);
        sourceFolder.create();

        return sourceFolder;
    }

    try{
        setParamsFromScriptArgs();

        returnObj.structure = exportStructureJSON();
    }catch(err){
        returnObj.error = err;
        app.consoleout("Error processing document structure : " + resourcePath + ", error : " + err);
    }finally{
        if(document){
            document.close(SaveOptions.no);
        }
    }

    return JSON.stringify(returnObj);
}());