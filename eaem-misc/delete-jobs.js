const https = require('https');
const QS = require('querystring');

let AEM_HOST = 'author-p999-e99999.adobeaemcloud.com';
let AEM_TOKEN = "eyJ....";
let PATH = "/var/eventing/jobs/assigned/42bc5d46-950b-468c-8287-8470c35e8128/async.process";
let LIMIT = 1000;
let QB = "/bin/querybuilder.json?type=slingevent:Job&p.hits=selective&p.properties=asset%20jcr:path&p.limit=" + LIMIT + "&path=";
let goAhead = true;

runQueryAndProcess(QB + PATH);

function shouldDeleteJobForAsset(assetPath){
    if(!assetPath){
        return false;
    }

    return ( assetPath.startsWith("/content/dam/folder-1")
                || assetPath.startsWith("/content/dam/folder-2")
                || assetPath.startsWith("/content/dam/folder-3"));
}

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

                console.log("COUNT OF JOBS TO DELETE : " + json.results + ", OUT OF : " + json.total);

                json.hits.forEach((hit) => {
                    if(shouldDeleteJobForAsset(hit.asset)){
                        startDelete(hit["jcr:path"], hit.asset);
                    }else{
                        console.log("SKIPPING JOB : " + hit["jcr:path"] + " for asset : " + hit.asset);
                    }
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

function startDelete(jobPath, assetPath){
    const INTERVAL = setInterval(() => {
        if(goAhead){
            goAhead = false;
            clearInterval(INTERVAL);
            doDeleteJob(jobPath, assetPath);
        }
    }, 500);
}

function doDeleteJob(jobPath, assetPath){
    const postData = {
        ":operation" : "delete"
    };

    let payload = QS.stringify(postData);

    const options = {
        hostname: AEM_HOST,
        path: jobPath,
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + AEM_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': payload.length
        }
    }

    let req = https.request(options, (res) => {
        res.setEncoding('utf8');

        console.log("Status : " + res.statusCode);

        res.on('data', () => {
            console.log(res.statusCode + " : DELETED JOB : " + jobPath + " for asset : " + assetPath);
            goAhead = true;
        });
    });

    req.on('error', (e) => {
        console.log("ERROR DELETE : "  + jobPath + " , " + e);
        goAhead = true;
    });

    req.write(payload);
    req.end();
}



