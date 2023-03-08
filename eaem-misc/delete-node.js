const https = require('https');
const QS = require('querystring');

let AEM_HOST = 'author-p9999-e99999.adobeaemcloud.com';
let AEM_TOKEN = "eyJhb.....";
let PATH = "/oak:index/ntFolderDamLucene-6";

doDeleteJob(PATH);

function doDeleteJob(nodePath){
    const postData = {
        ":operation" : "delete"
    };

    let payload = QS.stringify(postData);

    const options = {
        hostname: AEM_HOST,
        path: nodePath,
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + AEM_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': payload.length
        }
    }

    let req = https.request(options, (res) => {
        res.setEncoding('utf8');

        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on('end', () => {
            console.log(res.statusCode + " : DELETED NODE : " + nodePath);
        });
    });

    req.on('error', (e) => {
        console.log("ERROR DELETE : "  + nodePath + " , " + e);
    });

    req.write(payload);
    req.end();
}



