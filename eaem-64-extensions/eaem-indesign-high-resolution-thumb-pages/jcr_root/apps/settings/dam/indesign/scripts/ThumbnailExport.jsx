app.consoleout('EAEM - Relinking with High-Res Originals downloading from AEM...');

eaemReplaceLowResWithHighRes(document);

eaemExportThumbnailUsingIDSIndd(document);

function eaemDownloadAndGetHighResMap(aemLinks){
    var aemToLocalMap = {}, aemLinkPath = "", fileName, localPath;

    try{
        app.consoleout('EAEM - START downloading High-Res renditions...');

        for(var i = 0; i < aemLinks.length; i++ ) {
            aemLinkPath = aemLinks[i];

            fileName = aemLinkPath.substring(aemLinkPath.lastIndexOf("/"));

            localPath = new File(sourceFolder.fullName + fileName);

            app.consoleout('EAEM - Downloading : ' + aemLinkPath + ", to : " + localPath.fsName);

            fetchResource (host,  credentials, aemLinks[i], localPath);

            app.consoleout('EAEM - Download complete : ' + aemLinkPath + ", to : " + localPath.fsName);

            aemToLocalMap[aemLinkPath] = localPath;
        }

        app.consoleout('EAEM - END downloading High-Res Renditions...');
    }catch(err){
        app.consoleout('EAEM - ERROR downloading : ' + aemLinkPath);
    }

    return aemToLocalMap;
}

function eaemReplaceLowResWithHighRes(document){
    var links = document.links, aemToLocalMap, link, filePath, highResPath;

    aemToLocalMap = eaemDownloadAndGetHighResMap(eaemGetAllLinks(document));

    try{
        app.consoleout('EAEM - START relinking with High-Res renditions...');

        for(var l = 0; l < links.length; l++ ) {
            link = links[l];

            filePath = eaemNormalizePath(link.filePath);

            filePath = eaemAddDAMRootToPath(filePath.substring(filePath.indexOf("/")));

            highResPath = aemToLocalMap[filePath];

            app.consoleout('EAEM - RELINKING High-Res : ' + highResPath);

            link.relink(highResPath);

            link.update();
        }

        app.consoleout('EAEM - END relinking with High-Res renditions...');
    }catch(err){
        app.consoleout('EAEM - ERROR relinking : ' + highResPath);
    }
}

function eaemNormalizePath(path){
    if(!path){
        return path;
    }

    path = path.replace(/\\/g, "/");

    if(path.indexOf(":/") == 1){
        //windows paths are like X:/content/dam/wip/myfile.jpg
    }else{
        path = path.replace(/:/g, "/");

        if(path.indexOf("/") > 0){
            path = "/" + path;
        }
    }

    return path;
}

function eaemAddDAMRootToPath(path){
    var EAEM_CONTENT_DAM_ROOT = "/content/dam",
        MAC_CONTENT_DAM_ROOT = "/DAM",
        MAC_CONTENT_DAM_VOLUME_ROOT = "/Volumes/DAM";

    if(!path){
        return path;
    }

    if(path.indexOf(MAC_CONTENT_DAM_ROOT) == 0){
        path = EAEM_CONTENT_DAM_ROOT + path.substring(MAC_CONTENT_DAM_ROOT.length);
    }else if(path.indexOf(MAC_CONTENT_DAM_VOLUME_ROOT) == 0){
        path = EAEM_CONTENT_DAM_ROOT + path.substring(MAC_CONTENT_DAM_VOLUME_ROOT.length);
    }else if(path.indexOf(EAEM_CONTENT_DAM_ROOT) != 0){
        path = EAEM_CONTENT_DAM_ROOT + path;
    }

    return path;
}

function eaemGetAllLinks(document){
    var linkAEMPaths = [],
        links = document.links, link, filePath;

    for(var i = 0; i < links.length; i++ ) {
        link = links[i];

        filePath = eaemNormalizePath(link.filePath);

        filePath = eaemAddDAMRootToPath(filePath.substring(filePath.indexOf("/")));

        linkAEMPaths.push(filePath);
    }

    return linkAEMPaths;
}

function eaemExportThumbnailUsingIDSIndd(document){
    app.consoleout('EAEM - Generating thumbnail renditions...');

    var tnFolder = new Folder(exportFolder.fullName + "/thumbnail"), thumbnail;

    tnFolder.create();

    with (app.jpegExportPreferences) {
        exportResolution = 300;
        jpegColorSpace = JpegColorSpaceEnum.RGB;
        jpegQuality = JPEGOptionsQuality.MAXIMUM;
        jpegRenderingStyle = JPEGOptionsFormat.PROGRESSIVE_ENCODING;
        viewDocumentAfterExport = false;
        pageString = document.pages.item(0).name;
        jpegExportRange = ExportRangeOrAllPages.EXPORT_RANGE;
    }

    thumbnail = new File(tnFolder.fullName + '/cq5dam.web.1280.1280.jpeg');

    document.exportFile(ExportFormat.JPG, thumbnail);

    app.consoleout('EAEM - Posting file cq5dam.web.1280.1280.jpeg to location: ' + target + '/jcr:content/renditions');

    putResource(host, credentials, thumbnail, 'cq5dam.web.1280.1280.jpeg', 'image/jpeg', target);

    app.jpegExportPreferences.exportResolution = 72;

    app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.LOW;

    thumbnail = new File(tnFolder.fullName + '/thumbnail.jpg');

    document.exportFile(ExportFormat.JPG, thumbnail);

    app.consoleout('EAEM - Posting file thumbnail.jpg to location: ' + target + '/jcr:content/renditions');

    putResource(host, credentials, thumbnail, 'thumbnail.jpg', 'image/jpeg', target);
}


