(function () {
    var aemHost, base64EncodedAEMCreds, resourcePath, relinkHostPrefix = "";

    var QUERY_BUILDER_PATH = "/bin/querybuilder.json?path=/content/dam&type=dam:Asset&group.p.or=true",
        AEMS_PROTOCOL = "aems://",
        document,
        sourceFile = "",
        relinkedFile = "";

    try{
        setTestParams();

        document = app.open(sourceFile);

        var hostPrefix = relinkHostPrefix;

        if(!hostPrefix){
            hostPrefix =  AEMS_PROTOCOL + aemHost;
        }

        var links = document.links;
        var aemPaths = getAEMPaths(links);

        relinkLocalToAEM(links, aemPaths, hostPrefix);
    }catch(err){
        app.consoleout("Error processing document : " + resourcePath + ", error : " + err);
    }finally{
        if(document){
            document.close(SaveOptions.no);
        }
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

        document.save(new File(relinkedFile));
    }

    function setTestParams(){
        base64EncodedAEMCreds = "YWRtaW46YWRtaW4=";
        aemHost = "localhost:4502";
    }

    function getAEMPaths(links){
        var query = QUERY_BUILDER_PATH,
            aemPaths = {};

        for(var i = 0; i < links.length; i++ ){
            query = query + "&group." + (i + 1) + "_nodename=" + links[i].name;
        }

        var response = getResponse(aemHost, query, base64EncodedAEMCreds);

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

    function getResponse(host, uri, base64Creds){
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