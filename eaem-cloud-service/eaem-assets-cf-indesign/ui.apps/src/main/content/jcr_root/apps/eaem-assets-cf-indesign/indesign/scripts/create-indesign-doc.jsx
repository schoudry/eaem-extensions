(function () {
    var returnObj = {}, aemHost, base64EncodedAEMCreds, resourcePath, document,
        aemUploadPath, contentJson;

    function createPDF() {
        var sourceFolder = getSourceFolder(),
            fileName = resourcePath.substring(resourcePath.lastIndexOf ('/') + 1),
            xmlFile = new File( sourceFolder.fullName + "/" + fileName + ".xml"),
            sourceFile = new File(sourceFolder.fullName + "/" + fileName);

        with (app.pdfExportPreferences) {
            viewDocumentAfterExport = false;
            pageRange = PageRange.ALL_PAGES;
        }

        app.consoleout('Fetching resource from AEM: ' + aemHost + resourcePath + ' to ' + sourceFile);

        fetchResource (aemHost,  base64EncodedAEMCreds, resourcePath, sourceFile);

        var pdfOutputFile = new File(sourceFolder.fullName + "/" + fileName + '.pdf');

        app.consoleout('Started PDF export - ' + pdfOutputFile);

        if(contentJson){
            document = app.open(sourceFile);

            document.exportFile(ExportFormat.xml, xmlFile);

            xmlFile.open('r');

            var xmlContent = xmlFile.read();

            xmlFile.close();

            var structureXML = new XML (xmlContent),
                eles = structureXML.elements(), element, eleName, data;

            for(var x = 0 ; x < eles.length(); x++){
                element = eles.child(x);
                eleName = element.name();
                data = contentJson[eleName];

                if(data){
                    if(data.type === "JCR_PATH"){
                        var jcrName = data.value.substring(data.value.lastIndexOf ('/') + 1);

                        if(jcrName.indexOf("cq5dam.") == 0){
                            jcrName = data.value.substring(0, data.value.lastIndexOf ('/jcr:content/renditions'));
                            jcrName = jcrName.substring(jcrName.lastIndexOf ('/') + 1);
                        }

                        var jcrFile = new File(sourceFolder.fullName + "/" + jcrName);

                        app.consoleout('Fetching resource : ' + data.value + ' to ' + jcrFile);

                        fetchResource (aemHost,  base64EncodedAEMCreds, data.value, jcrFile);

                        structureXML[eleName].@href = "file://./" + jcrName;
                    }else{
                        structureXML[eleName] = data.value;
                    }
                }else{
                    delete structureXML[eleName];
                }
            }

            xmlFile.encoding = "UTF8";

            xmlFile.open("w");

            xmlContent = structureXML.toString();

            xmlFile.write(xmlContent);

            xmlFile.close();

            document.importXML(xmlFile);
        }

        document.exportFile(ExportFormat.pdfType, pdfOutputFile);

        app.consoleout('Uploading PDF to - ' + aemUploadPath);

        putResource(aemHost, base64EncodedAEMCreds, pdfOutputFile, pdfOutputFile.name, 'application/pdf', aemUploadPath);

        sourceFolder.remove();

        app.consoleout('PDF export complete...');

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

        if (app.scriptArgs.isDefined("resourcePath")) {
            resourcePath = app.scriptArgs.getValue("resourcePath");
        } else {
            throw "resourcePath argument missing";
        }

        if (app.scriptArgs.isDefined("contentJson")) {
            contentJson = JSON.parse(app.scriptArgs.getValue("contentJson"));
            app.consoleout('contentJson: ' + app.scriptArgs.getValue("contentJson"));
        } else {
            throw "contentJson argument missing";
        }

        aemUploadPath = app.scriptArgs.getValue("aemUploadPath");

        app.consoleout('base64EncodedAEMCreds --- ' + base64EncodedAEMCreds);
        app.consoleout('aemHost --- ' + aemHost);
        app.consoleout('resourcePath --- ' + resourcePath);
        app.consoleout('aemUploadPath --- ' + aemUploadPath);
    }

    try{
        setParamsFromScriptArgs();

        //setTestParams();

        createPDF();
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
