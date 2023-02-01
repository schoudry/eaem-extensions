const https = require('https');
const QS = require('querystring');

let AEM_HOST = 'author-p10961-e880305.adobeaemcloud.com';
let AEM_TOKEN = "eyJhbGciOiJ";
let ROOT_FOLDER = "/content/dam/experience-aem-cs";
const META_PROP = "dam:scene7Folder";
const META_PROP_STARTS_WITH = "EAEM/this-is-wrong";
const META_PROP_REPLACE_WITH = "EAEM/experience-aem-cs";
let goAhead = true;

requestFolderJson(ROOT_FOLDER);

function getUpdatedValue(value){
    if(!value){
        return undefined;
    }

    let modifiedValue = undefined;

    if(value.startsWith(META_PROP_STARTS_WITH)){
        modifiedValue = META_PROP_REPLACE_WITH + value.substring(META_PROP_STARTS_WITH.length);
    }

    return modifiedValue;
}

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
            clearInterval(INTERVAL);
            doRequest(options, parentFolderPath);
        }
    }, 500);
}

function doRequest(options, parentFolderPath){
    goAhead = false;

    console.error("WORKING ON FOLDER : " + parentFolderPath);

    https.get(options,(res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                let json = JSON.parse(body);
                let updated = 0, assetPath;

                Object.keys(json).forEach(function(name) {
                    if(json[name]["jcr:primaryType"] == "sling:Folder"){
                        requestFolderJson(parentFolderPath + "/" + name)
                    }else if(json[name]["jcr:primaryType"] == "dam:Asset"){
                        assetPath = parentFolderPath + "/" + name;
                        updated = updated + checkAndUpdateAsset(assetPath);
                    }
                });

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

function checkAndUpdateAsset(assetPath){
    const INTERVAL = setInterval(() => {
        if(goAhead){
            clearInterval(INTERVAL);
            checkAndUpdateAssetHandler();
        }
    }, 500);

    function checkAndUpdateAssetHandler(){
        const metadataPath = assetPath + "/_jcr_content/metadata";

        const options = {
            hostname: AEM_HOST,
            path: metadataPath + ".json",
            headers: {
                Authorization: 'Bearer ' + AEM_TOKEN
            }
        }

        https.get(options,(res) => {
            let body = "";

            res.on("data", (chunk) => {
                body += chunk;
            });

            res.on("end", () => {
                try{
                    let value =  JSON.parse(body)[META_PROP];

                    if(value){
                        let updatedValue = getUpdatedValue(value);

                        if(updatedValue){
                            updateAssetMetadata(metadataPath, META_PROP, updatedValue);
                        }else{
                            console.log("\t" + metadataPath + "," + META_PROP + "=" + value + ", UPDATE NOT REQUIRED");
                        }
                    }
                }catch(err){
                    console.error("\tERROR READ : " + metadataPath + " : " + err.message);
                }

                goAhead = true;
            })
        }).on("error", (error) => {
            console.error("\tCONN ERROR : " + assetPath + " : " + error.message);
            goAhead = true;
        });
    }
}

function updateAssetMetadata(metadataPath, metaPropName, value){
    const postData = {
        [metaPropName] : value
    };

    let payload = QS.stringify(postData);

    const options = {
        hostname: AEM_HOST,
        path: metadataPath,
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
        });

        res.on('end', (d) => {
            if(res.statusCode == 200){
                console.log("\tSUCCESS UPDATE : "  + metadataPath + "," + metaPropName + "=" + value);
            }else{
                console.log("\tERROR UPDATE : "  + metadataPath + "," + metaPropName + "=" + value + "," + res.statusCode);
            }
        });
    });

    req.on('error', (e) => {
        console.log("\tERROR UPDATE : "  + metadataPath + "," + metaPropName + "=" + value + "," + e);
    });

    req.write(payload);
    req.end();
}

