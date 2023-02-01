const https = require('https');
const QS = require('querystring');

let AEM_HOST = 'author-p10961-e880305.adobeaemcloud.com';
let AEM_TOKEN = "eyJhbGciOiJQ";
let PATH = "/content/dam/eaem-svg-stream-clear-cache";
let LIMIT = -1;
//let QB = "/bin/querybuilder.json?type=dam:Asset&1_property=jcr:content/dam:assetState&1_property.value=PROCESSING&p.limit=" + LIMIT + "&path=";
let QB = "/bin/querybuilder.json?type=dam:Asset&p.limit=" + LIMIT + "&path=";
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

    doQueryRequest(options);
}

function doQueryRequest(options){
    https.get(options,(res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                let json = JSON.parse(body);

                console.log("COUNT OF ASSETS TO REPROCESS : " + json.results);

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
    const postData = {
        asset : path,
        operation : 'PROCESS',
        "profile-select" : "full-process",
        runPostProcess: "false",
        description: "Reprocessing asset - " + path,
    };

    let payload = QS.stringify(postData);

    const options = {
        hostname: AEM_HOST,
        path: '/bin/asynccommand',
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + AEM_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': payload.length
        }
    }

    let req = https.request(options, (res) => {
        res.setEncoding('utf8');

        res.on('data', () => {
            console.log(res.statusCode + " : STARTED REPROCESS : " + path);
            goAhead = true;
        });
    });

    req.on('error', (e) => {
        console.log("ERROR REPROCESS : "  + path + " , " + e);
        goAhead = true;
    });

    req.write(payload);
    req.end();
}



