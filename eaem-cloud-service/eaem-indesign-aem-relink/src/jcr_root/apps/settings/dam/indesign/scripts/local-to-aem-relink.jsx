(function () {
    var RELINK_HOST_PREFIX = "",
        QUERY_BUILDER_PATH = "/bin/querybuilder.json?path=/content/dam&type=dam:Asset",
        AEM_RELINKED_DOC_SUFFIX = "-with-aem-links.indd",
        AEMS_PROTOCOL = "aems://";

    try{
        app.consoleout('Checking if relinking to AEM links is required for : ' + resourcePath);

        var links = document.links,
            hostPrefix = RELINK_HOST_PREFIX;

        if(!hostPrefix){
            hostPrefix =  AEMS_PROTOCOL + host;
        }

        if(!hasAEMLinks(links)){
            app.consoleout('Document contains local links, AEM relinking required : ' + resourcePath);

            var aemPaths = getAEMPaths(links);

            relinkLocalToAEM(links, aemPaths, hostPrefix);

            var fileName = resourcePath.substring(resourcePath.lastIndexOf ('/') + 1, resourcePath.lastIndexOf ('.') ),
                relinkedFileName = fileName + AEM_RELINKED_DOC_SUFFIX,
                relinkedFile = new File( sourceFolder.fullName + "/" + relinkedFileName);

            document.save(relinkedFile);

            app.consoleout('Uploading relinked doc to : ' + target + '/jcr:content/renditions' + ", as : " + relinkedFileName);

            putResource(host, credentials, relinkedFile, relinkedFileName, "application/x-indesign", target);
        }else{
            app.consoleout('Document contains AEM links, relinking to AEM NOT required : ' + resourcePath);
        }
    }catch(err){
        app.consoleout("Error relinking document : " + resourcePath + ", error : " + err);
    }

    function hasAEMLinks(links){
        var containsAEMLinks = false;

        for(var i = 0; i < links.length; i++ ){
            if(links[i].linkResourceURI.indexOf(AEMS_PROTOCOL) == 0){
                containsAEMLinks = true;
                break;
            }
        }

        return containsAEMLinks;
    }

    function relinkLocalToAEM(links, aemPaths, hostPrefix){
        for(var i = 0; i < links.length; i++ ){
            var link = links[i],
                aemPath = aemPaths[link.name];

            if(!aemPath){
                app.consoleout("Could not find aem path for file : " + link.name);
                continue;
            }

            var aemLink = hostPrefix + aemPath;

            try{
                app.consoleout("Relinking to aem with uri : " + aemLink);
                link.reinitLink(aemLink );
            }catch(err){
                app.consoleout("error relinking : " + err);
                return;
            }
        }
    }

    function getInDesignDocRealAEMPath(){
        var fileName = resourcePath.substring(resourcePath.lastIndexOf ('/') + 1 ),
            query = QUERY_BUILDER_PATH + "&nodename=" + fileName;

        var hitMap = fetchJSONObjectByGET(host, credentials, query);

        if(!hitMap || (hitMap.hits.length == 0)){
            return;
        }

        var aemPath;

        for(var i = 0; i < hitMap.hits.length; i++ ){
            aemPath = hitMap.hits[i]["path"];
        }

        return aemPath;
    }

    function getAEMPaths(links){
        var query = QUERY_BUILDER_PATH + "&group.p.or=true",
            aemPaths = {};

        for(var i = 0; i < links.length; i++ ){
            query = query + "&group." + (i + 1) + "_nodename=" + links[i].name;
        }

        var hitMap = fetchJSONObjectByGET(host, credentials, query);

        if(!hitMap || (hitMap.hits.length == 0)){
            app.consoleout('No Query results....');
            return;
        }

        for(var i = 0; i < hitMap.hits.length; i++ ){
            aemPaths[hitMap.hits[i]["name"]] = hitMap.hits[i]["path"];
        }

        return aemPaths;
    }
}());