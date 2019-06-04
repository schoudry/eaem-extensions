app.consoleout('START - Creating PDF Export using jobOptions....');

exportPDFUsingJobOptions();

app.consoleout('END - Creating PDF Export using jobOptions....');

function exportPDFUsingJobOptions(){
    var QUERY = "/bin/querybuilder.json?path=/content/dam&nodename=" + getAEMNodeName(),
        META_EAEM_PDF_JOBOPTIONS = "eaemPDFJobOptions";

    app.consoleout("QUERY : " + QUERY);

    var response = getResponse(host, QUERY, credentials);

    if(!response){
        return;
    }

    var hitMap = JSON.parse(response);

    if(!hitMap || (hitMap.hits.length == 0)){
        app.consoleout('No Query results....');
        return;
    }

    var aemFilePath = hitMap.hits[0]["path"],
        folderPath = getAEMParentFolder(aemFilePath);

    app.consoleout("Folder path : " + folderPath);

    response = getResponse(host, folderPath + "/jcr:content/metadata.json", credentials);

    var metadataMap = JSON.parse(response);

    var jobOptionsName = metadataMap[META_EAEM_PDF_JOBOPTIONS];

    if(!jobOptionsName){
        app.consoleout('jobOptions does not exist in folder metadata....');
        return;
    }

    var exportFolderPdf = new Folder(exportFolder.fullName + "/pdf"),
        pdfFileName = fileName + ' - ' + jobOptionsName + '.pdf';

    try{
        exportFolderPdf.create();

        app.consoleout("Creating pdf file " + (exportFolderPdf.fullName + pdfFileName) + " with preset job option - " + jobOptionsName);

        var pdfOutputFile = new File(exportFolderPdf.fullName + pdfFileName);

        with (app.pdfExportPreferences) {
            viewDocumentAfterExport = false;
        }

        document.exportFile(ExportFormat.pdfType, pdfOutputFile, app.pdfExportPresets.item("[" + jobOptionsName+ "]"));

        app.consoleout("Uploading to AEM pdf file " + pdfFileName + ' to location: ' + target + '/jcr:content/renditions');

        putResource (host, credentials,  pdfOutputFile, pdfFileName, 'application/pdf', target);
    }catch (err) {
        //app.consoleout(err);
    }finally {
        cleanup(exportFolderPdf);
    }
}

function getAEMNodeName(){
    return resourcePath.substring(resourcePath.lastIndexOf("/") + 1);
}

function getAEMParentFolder(filePath){
    return filePath.substring(0, filePath.lastIndexOf("/"));
}

function getResponse(host, uri, creds){
    var aemConn = new Socket, body = "", response, firstRead = true;

    if (!aemConn.open(host, "UTF-8")) {
        return;
    }

    aemConn.write ("GET "+ encodeURI(uri) +" HTTP/1.0");
    aemConn.write ("\n");
    aemConn.write ("Authorization: Basic " + creds);
    aemConn.write ("\n\n");

    while( response = aemConn.read() ){
        response = response.toString();

        if(!firstRead){
            body = body + response;
            continue;
        }

        var strings = response.split("\n");

        for(var x = 0; x < strings.length; x++){
            if( (x == 0) && (strings[x].indexOf("200") === -1)){
                return body;
            }

            if(x === (strings.length - 1)){
                body = body + strings[x];
            }
        }

        firstRead = false;
    }

    return body;
}

