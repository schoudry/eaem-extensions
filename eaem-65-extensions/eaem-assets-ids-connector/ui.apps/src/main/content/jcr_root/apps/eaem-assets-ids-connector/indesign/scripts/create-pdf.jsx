(function () {
    var returnObj = {}, aemHost, base64EncodedAEMCreds, resourcePath, uploadUrl, document,
        AWS_DOMAIN_SUFFIX = ".amazonaws.com", aemUploadPath, contentJson;

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

        //app.consoleout('Uploading PDF to - ' + uploadUrl);
        //uploadToS3(pdfOutputFile, 'application/pdf');

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

        if (app.scriptArgs.isDefined("uploadUrl")) {
            uploadUrl = app.scriptArgs.getValue("uploadUrl");
        } else {
            throw "uploadUrl argument missing";
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
        app.consoleout('uploadUrl --- ' + uploadUrl);
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

    /*function uploadToS3(file, contentType) {
        app.consoleout("Uplading to S3 : " + file);

        file.open ("r");
        file.encoding = "BINARY";

        var boundary = '----------V2ymHFg03ehbqgZCaKO6jy',
            awsHost = uploadUrl.substring(0, uploadUrl.indexOf(AWS_DOMAIN_SUFFIX)) + AWS_DOMAIN_SUFFIX,
            awsUploadUri = uploadUrl.substring(awsHost.length),
            awsHost = awsHost.substring(awsHost.indexOf("://") + 3) + ":80",
            connection = new Socket;

        app.consoleout("awsHost > " + awsHost);
        app.consoleout("awsUploadUri > " + awsUploadUri);

        if (connection.open (awsHost, "binary")) {
            connection.write ("PUT "+ awsUploadUri +" HTTP/1.1");
            connection.write ("\n");
            connection.write ("Content-Type: multipart/form-data; boundary=" + boundary);
            connection.write ("\n");
            var body = buildMultipartBody (boundary, file, file.name, contentType);
            connection.write ("Content-Length: " + body.length);
            connection.write ("\r\n\r\n");
            //END of header
            connection.write (body);
            connection.read();
            while (!connection.eof) {
                var output = connection.read();
                app.consoleout("output : " + output);

            }
            connection.close();
        }else {
            file.close();
            throw 'Connection to S3 could not be opened';
        }

    }

    function setTestParams(){
        contentJson = {
            "Page_1_H1":{"type":"RAW_TEXT","value":"Test Texas"},
            "Page_2_callout_title":{"type":"RAW_TEXT","value":"Again California"},
            "Page_1_featured_bgImage":{"type":"JCR_PATH","value":"/content/dam/gcom/allowed.jpeg"},
            "Page_1_primary_logo":{"type":"JCR_PATH","value":"/content/dam/gcom/neither.png"}
        };
        base64EncodedAEMCreds = "YWRtaW46YWRtaW4=";
        aemHost = "localhost:4502";
        resourcePath = "/content/dam/gcom/jci-philanthropic-report-template.indd";
        uploadUrl = "https://gcom-dev.s3.us-east-2.amazonaws.com/jci-philanthropic-report-template.indd.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220602T133401Z&X-Amz-SignedHeaders=host&X-Amz-Expires=86399&X-Amz-Credential=AKIATUOLYZC4WYICJHP5%2F20220602%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Signature=f73929a87b56e00a388e78f0e54209adadd25daca4f24122cc83d0023b21f3b3";
        aemUploadPath = "/var/dam/gcom/2022-06-02/acf8e234-945a-4541-985f-8f59000fbb56";
    }

    function fetchResource(host, credentials, resource, file) {
        var success = file.open ("w");
        file.encoding = "BINARY";
        var connection = new Socket;

        // transform host (get context path, add port 80 when not set etc.)
        var transformedHost = transformHost(host);
        host = transformedHost.host;
        var contextPath = transformedHost.contextPath

        if (connection.open (host, "binary")) {

            // very basic request to fetch a single resource
            connection.write ("GET "+ encodeURI(contextPath+resource) +" HTTP/1.0");
            connection.write ("\n");
            connection.write ("Authorization: Basic "+credentials);
            connection.write ("\n\n");

            // skip header - Sling seems to always return proper headers
            // Works for now but needs to be improved
            var buffer = "";
            while (!connection.eof) {
                var ch = connection.read(1);
                if (ch.match("\n")) {
                    if (buffer.length == 1) {
                        // start of message body
                        break;
                    }
                    buffer = "";
                } else {
                    buffer = buffer + ch;
                }
            }

            // write message body
            while (!connection.eof) {
                file.write(connection.read());
            }

            connection.close();
            if (file.error != "") {
                app.consoleout('Failed to open ' + file.error);
            }

            file.close();
        }
        else {
            file.close();
            throw 'Connection to host ' + host + ' could not be opened';
        }
    }

    function transformHost(hostExpression) {
        var contextPath = "";
        var host = hostExpression;

        // remove contextPath
        idx = host.indexOf('/');
        if (idx > 0){
            contextPath = host.substring(idx);
            host = host.substring(0, idx);
        }
        return {
            contextPath : contextPath,
            host : host,
            protocol : "http://"
        }
    }*/
}());
