(function () {
    var RELINK_HOST_PREFIX = "",
        QUERY_BUILDER_PATH = "/bin/querybuilder.json?path=/content/dam&type=dam:Asset&group.p.or=true",
        AEM_RELINKED_DOC_SUFFIX = "-with-aem-links.indd",
        AEMS_PROTOCOL = "aems://";

    try{
        app.consoleout('Checking if relinking to AEM links is required for : ' + resourcePath);

        var links = document.links,
            hostPrefix = RELINK_HOST_PREFIX;

        if(!hostPrefix){
            hostPrefix =  AEMS_PROTOCOL + host;
        }

        if(!hasAEMLinks()){
            app.consoleout('Document contains local links, AEM relinking required : ' + resourcePath);

            var aemPaths = getAEMPaths(links);

            relinkLocalToAEM(links, aemPaths, hostPrefix);

            var fileName = resourcePath.substring(resourcePath.lastIndexOf ('/') + 1, resourcePath.lastIndexOf ('.') ),
                relinkedFile = new File( sourceFolder.fullName + "/" + fileName + AEM_RELINKED_DOC_SUFFIX + ".indd");

            document.save(relinkedFile);

            app.consoleout('Document links relinked to AEM : ' + resourcePath + ", saved in indesign servet at : " + relinkedFile);
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

    function getAEMPaths(links){
        var query = QUERY_BUILDER_PATH,
            aemPaths = {};

        for(var i = 0; i < links.length; i++ ){
            query = query + "&group." + (i + 1) + "_nodename=" + links[i].name;
        }

        var response = fetchJSONObjectByGET(host, credentials, query);

        if(!response){
            return;
        }

        var hitMap = JSON.parse(response);

        if(!hitMap || (hitMap.hits.length == 0)){
            app.consoleout('No Query results....');
            return;
        }

        for(var i = 0; i < hitMap.hits.length; i++ ){
            aemPaths[hitMap.hits[i]["name"]] = hitMap.hits[i]["path"];
        }

        return aemPaths;
    }

    function getQueryResponseFromAEM(host, uri, base64Creds){
        var aemConn = new Socket, body = "", response, firstRead = true;

        if (!aemConn.open(host, "UTF-8")) {
            return;
        }

        aemConn.write ("GET "+ encodeURI(uri) +" HTTP/1.0");
        aemConn.write ("\n");
        aemConn.write ("Authorization: Basic " + base64Creds);
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
}());