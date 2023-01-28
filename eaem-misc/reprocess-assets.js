const https = require('https');

let AEM_HOST = 'author-p999-e9999.adobeaemcloud.com';
let AEM_TOKEN = "x3qoDa4q9zhjn98qHRDXfxJDYA";
let QB = "/bin/querybuilder.json?type=dam:Asset&1_property=jcr:content/dam:assetState&1_property.value=PROCESSING&path=";
let PATH = "/content/dam/staging/choices/historical/50/90";
let goAhead = true;

runQueryAndProcess(QB + PATH);

function runQueryAndProcess(query) {
    const options = {
        hostname: AEM_HOST,
        path: query,
        headers: {
            Authorization: 'Bearer ' + AEM_TOKEN
        }
    }

    doRequest(options);
}

function startReprocess(path){
    const INTERVAL = setInterval(() => {
        if(goAhead){
            goAhead = false;
            clearInterval(INTERVAL);
            doReprocessOnAsset(path);
        }
    }, 500);
}

function doReprocessOnAsset(path){
    const postData = JSON.stringify({
        asset : path,
        operation : 'PROCESS',
        "profile-select" : "full-process",
        runPostProcess: "false",
        description: "Reprocessing asset - " + path,

    });

    const options = {
        hostname: AEM_HOST,
        path: '/bin/asynccommand',
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + AEM_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    }

    let req = https.request(options, (res) => {
        res.on('data', (d) => {
            console.log("STARTED REPROCESS : " + path);
            goAhead = true;
        });
    });

    req.on('error', (e) => {
        console.log("ERROR REPROCESS : "  + path + " , " + e);
        goAhead = true;
    });

    req.write(postData);
    req.end();
}

function doRequest(options){
    https.get(options,(res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                let json = JSON.parse(body);

                console.log("ASSETS TO REPROCESS : " + json.hits.length);

                json.hits.forEach((hit) => {
                    startReprocess(hit.path)
                });
            } catch (error) {
                console.error("ERROR : " + error.message);
                goAhead = true;
            }
        });
    }).on("error", (error) => {
        console.error("CONN ERROR : " + error.message);
        goAhead = true;
    });
}

