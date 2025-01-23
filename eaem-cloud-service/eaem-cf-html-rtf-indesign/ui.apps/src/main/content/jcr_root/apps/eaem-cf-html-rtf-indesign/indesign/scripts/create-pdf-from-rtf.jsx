(function () {
    var returnObj = {}, aemHost, base64EncodedAEMCreds, cfPath, contentJson;

    function createInDesignDoc() {
        cfPath = contentJson.path;

        var sourceFolder = getSourceFolder(),
            fileName = cfPath.substring(cfPath.lastIndexOf ('.rtf')),
            documentFile = new File(sourceFolder.fullName + "/" + fileName + '.indd'),
            pdfOutputFile = new File(sourceFolder.fullName + "/" + fileName + '.pdf');

        var document = app.documents.add();
        var spread = document.spreads.lastItem();
        var textFrame = createTextFrame(spread);

        var rtfPath = sourceFolder + "/" + new Date().getTime() + ".rtf";
        var rtfFile = new File(rtfPath);

        rtfFile.open('w');
        rtfFile.encoding = 'UTF8';

        rtfFile.write(contentJson["rtfText"]);
        rtfFile.close();

        textFrame.place(File(rtfPath));

        document.exportFile(ExportFormat.pdfType, pdfOutputFile);
        document.save(documentFile);
        //document.close();

        var uploadPath = cfPath.substring(0, cfPath.lastIndexOf("/"));

        app.consoleout('Uploading file - ' + pdfOutputFile);

        uploadDAMFile(aemHost, base64EncodedAEMCreds, pdfOutputFile, pdfOutputFile.name, 'application/pdf', uploadPath);

        returnObj.success = "completed";
    }

    function createTextFrame(spread) {
        var textFrame = spread.textFrames.add();

        var y1 = 5; // upper left  Y-Coordinate
        var x1 = 5; // upper left  X-Coordinate
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

    function uploadDAMFile(host, credentials, file, fileName, contentType, aemFolderPath) {
        var transformedHost = transformHost(host);
        host = transformedHost.host;
        var contextPath = transformedHost.contextPath

        var success = false;
        var statusFromServer = 0;
        var retries = 0;

        while(!success && retries<5){
            file.open ("r");
            file.encoding = "BINARY";
            var boundary = '----------V2ymHFg03ehbqgZCaKO6jy';
            var connection = new Socket;
            if (connection.open (host, "binary")) {
                connection.write ("POST "+ encodeURI(contextPath + aemFolderPath + ".createasset.html") +" HTTP/1.0");
                connection.write ("\n");
                connection.write ("Authorization: Basic " + credentials);
                connection.write ("\n");
                connection.write ("User-Agent: Jakarta Commons-HttpClient/3.1");
                connection.write ("\n");
                connection.write ("Content-Type: multipart/form-data; boundary="+boundary);
                connection.write ("\n");
                var body = getMultiPartBodyDAMUpload(boundary, file, fileName, contentType);
                connection.write ("Content-Length: "+body.length);
                connection.write ("\r\n\r\n");
                //END of header
                connection.write (body);

                statusFromServer = readResponse(connection);

                if(statusFromServer>=400){
                    app.consoleout('Seen error response '+statusFromServer+' ['+retries+']');
                } else if (statusFromServer>=300) {
                    app.consoleout('Redirects currently not supported');
                } else if (statusFromServer>=200) {
                    success=true;
                }

                if(!success){
                    ++retries;
                }
            } else {
                app.consoleout('Connection to host ' + host + ' could not be opened');
            }
            file.close();
        }
    }

    function getMultiPartBodyDAMUpload(boundary, file, fileName, contentType) {
        var endBoundary = '\r\n--' + boundary + '--\r\n';
        var body;

        body = body + '--'+boundary+'\r\n';
        body = body + 'content-disposition: form-data; name="_charset_"';
        body = body + '\r\n\r\n';
        body = body + 'utf-8';
        body = body + '\r\n';

        body = body + '--'+boundary+'\r\n';
        body = body + 'content-disposition: form-data; name="fileName"';
        body = body + '\r\n\r\n';
        body = body + fileName;
        body = body + '\r\n';

        body = body + '--'+boundary+'\r\n';
        body = body + 'content-disposition: form-data; name="file"; filename="'+Base64._utf8_encode(fileName)+'"\r\n';

        if (contentType) {
            body = body + 'Content-Type: '+contentType+'\r\n';
        }
        body = body + 'Content-Transfer-Encoding: binary\r\n';
        body = body + '\r\n';

        var content;
        while ((content = file.read ()) != '') {
            body = body + content;
        }

        file.close();

        body = body + endBoundary;
        return body;
    }

    function setTestParams(){
        aemHost = "localhost:4502";
        base64EncodedAEMCreds = "YWRtaW46YWRtaW4=";
        contentJson = {"rtfText":"{\\rtf1\\ansi\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}\n" +
                "{\\colortbl ;\\red0\\green0\\blue255;}\n" +
                "{\\pard\\fs20\\sl288\\slmult1\\charscalex80\n" +
                "Second Run Following sentences are formatted witih Rich Text\n" +
                "\\par}\n" +
                "\n" +
                "{\\pard\\fs20\\sl288\\slmult1\\charscalex80\n" +
                "This is {\\b\n" +
                "Bold\n" +
                "}\n" +
                "\\par}\n" +
                "\n" +
                "{\\pard\\fs20\\sl288\\slmult1\\charscalex80\n" +
                "This is {\\i\n" +
                "Italic\n" +
                "}\n" +
                "\\par}\n" +
                "\n" +
                "{\\pard\\fs20\\sl288\\slmult1\\charscalex80\n" +
                "This is {\\i\n" +
                "{\\ul\n" +
                "Underline\n" +
                "}\n" +
                "}\n" +
                "\\par}\n" +
                "\n" +
                "{\\pard\\fs20\\sl288\\slmult1\\charscalex80\n" +
                "This is {\\b\n" +
                "{\\i\n" +
                "Bold and Italic\n" +
                "}\n" +
                "}\n" +
                "\\par}\n" +
                "\n" +
                "\n" +
                "}","path":"/content/dam/experience-aem/bold.rtf"}
    }

    try{
        setParamsFromScriptArgs();

        //setTestParams();

        createInDesignDoc();
    }catch(err){
        returnObj.error = err;
        app.consoleout("Error processing content fragment : " + cfPath + ", error : " + err);
    }finally{
    }

    return JSON.stringify(returnObj);
}());
