const https = require('https');

let AEM_HOST = 'author-p99999-e999999.adobeaemcloud.com';
let AEM_TOKEN = "eyJhbGciOiJSUzI1NiIsIn......................";
let ROOT_FOLDER = "/content/dam";
let totalCount = 0;
let goAhead = true;

requestFolderJson(ROOT_FOLDER);

function requestFolderJson(parentFolderPath) {
    const options = {
        hostname: AEM_HOST,
        path: parentFolderPath + ".1.json",
        headers: {
            Authorization: 'Bearer ' + AEM_TOKEN
        }
    }

    const INTERVAL = setInterval(() => {
        if(goAhead){
            doRequest(options, parentFolderPath);
            clearInterval(INTERVAL);
        }
    }, 500);
}

function doRequest(options, parentFolderPath){
    goAhead = false;

    https.get(options,(res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                let json = JSON.parse(body);
                let assetCountInFolder = 0;

                Object.keys(json).forEach(function(folderName) {
                    if(json[folderName]["jcr:primaryType"] == "sling:Folder"){
                        requestFolderJson(parentFolderPath + "/" + folderName)
                    }else if(json[folderName]["jcr:primaryType"] == "dam:Asset"){
                        assetCountInFolder++;
                    }
                });

                totalCount += assetCountInFolder;

                console.log(parentFolderPath + " = " + assetCountInFolder + ", total till now : " + totalCount);

                goAhead = true;
            } catch (error) {
                console.error("ERROR : " + parentFolderPath + " : " + error.message);
                goAhead = true;
            }
        });
    }).on("error", (error) => {
        console.error("CONN ERROR : " + parentFolderPath + " : " + error.message);
        goAhead = true;
    });
}

