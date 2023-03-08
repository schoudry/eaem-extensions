const https = require('https');
const QS = require('querystring');

const S7_NA_IPS_HOST = "s7sps1apissl.scene7.com";
const S7_USER = "user@adomain.com";
const S7_PASS = "pass";

let AEM_HOST = 'author-p9999-e9999.adobeaemcloud.com';
let AEM_TOKEN = "eyJhbGc";
const COMPANY_HANDLE_PROP = "dam:scene7CompanyID";
const ASSET_HANDLE_PROP = "dam:scene7ID";
const S7_NAME_PROP = "dam:scene7Name";
const S7_FOLDER_PROP = "dam:scene7Folder";
let ROOT_FOLDER = "/content/dam/eaem/en/adobe";
const S7_FOLDER_PROP_STARTS_WITH = "eaem/en/adobe/";
const S7_FOLDER_PROP_REPLACE_WITH = "eaem/eaem/en/adobe/";
let goAhead = true;

requestFolderJson(ROOT_FOLDER);

function getUpdatedS7FolderValue(value){
    if(!value){
        return undefined;
    }

    let modifiedValue = undefined;

    if(value.startsWith(S7_FOLDER_PROP_STARTS_WITH)){
        modifiedValue = S7_FOLDER_PROP_REPLACE_WITH + value.substring(S7_FOLDER_PROP_STARTS_WITH.length);
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
                    body = JSON.parse(body);
                    let value =  body[S7_FOLDER_PROP];
                    let companyHandle =  body[COMPANY_HANDLE_PROP];
                    let assetHandle =  body[ASSET_HANDLE_PROP];
                    let s7Name =  body[S7_NAME_PROP];

                    if(value){
                        let updatedFolderPath = getUpdatedS7FolderValue(value);

                        if(updatedFolderPath){
                            console.log("\tUPDATING : "  + S7_FOLDER_PROP + " IN AEM FOR ASSET " + s7Name + " to " + updatedFolderPath);
                            updateS7FolderMetaPropInAEM(metadataPath, S7_FOLDER_PROP, updatedFolderPath);

                            console.log("\tMOVING ASSET IN S7 " + s7Name + " to " + updatedFolderPath);
                            moveAssetInS7ToUpdatedFolder(companyHandle, s7Name, assetHandle, updatedFolderPath);

                            console.log("\t------------------------------------------------------------------");
                        }else{
                            console.log("\t" + metadataPath + "," + S7_FOLDER_PROP + "=" + value + ", UPDATE NOT REQUIRED");
                            console.log("\t------------------------------------------------------------------");
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


function updateS7FolderMetaPropInAEM(metadataPath, s7FolderPropName, s7FolderValue){
    const postData = {
        [s7FolderPropName] : s7FolderValue
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
            }else{
                console.log("\tERROR UPDATE : "  + metadataPath + "," + s7FolderPropName + "=" + s7FolderValue + "," + res.statusCode);
            }
        });
    });

    req.on('error', (e) => {
        console.log("\tERROR UPDATE : "  + metadataPath + "," + s7FolderPropName + "=" + s7FolderValue + "," + e);
    });

    req.write(payload);
    req.end();
}

function moveAssetInS7ToUpdatedFolder(companyHandle, s7Name, assetHandle, updatedFolderPath){
    let movePayload = getMovePaylod(companyHandle, assetHandle, updatedFolderPath);

    let options = {
        host: S7_NA_IPS_HOST,
        path: "/scene7/services/IpsApiService",
        method: "POST",
        headers: {
            'SOAPAction': "moveAssets",
            'Content-Type': 'text/xml',
            'Content-length' : Buffer.byteLength(movePayload)
        }
    };

    let req = https.request(options, (res) => {
        const chunks = [];
        res.on('data', data => chunks.push(data));

        res.on('end', () => {
            let resBody = Buffer.concat(chunks).toString();

            if(res.statusCode == 200){
                if(resBody.indexOf("<errorCount>1</errorCount>") > 0){
                    console.log("\t" + resBody);
                }
            }else{
                console.log("\tERROR MOVE IN S7 : " + s7Name + ","  + assetHandle + " to " + updatedFolderPath);
                console.log(res.statusCode, resBody);
            }
        });
    });

    req.on('error', (e) => {
        console.log("\tERROR MOVING IN S7 : "  + assetHandle + " to " + updatedFolderPath + ", " + e);
    });

    req.write(movePayload);
    req.end();
}

function getMovePaylod(companyHandle, assetHandle, folderPath){
    let payload = "<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
        "  <SOAP-ENV:Header>\n" +
        "    <authHeader xmlns=\"http://www.scene7.com/IpsApi/xsd/2016-01-14-beta\">\n" +
        "      <user>" + S7_USER + "</user>\n" +
        "      <password>" + S7_PASS + "</password>\n" +
        "      <locale>en-US</locale>\n" +
        "      <appName>Experience AEM</appName>\n" +
        "      <appVersion>1.0</appVersion>\n" +
        "      <faultHttpStatusCode>200</faultHttpStatusCode>\n" +
        "    </authHeader>\n" +
        "  </SOAP-ENV:Header>\n" +
        "  <SOAP-ENV:Body>\n" +
        "    <moveAssetsParam xmlns=\"http://www.scene7.com/IpsApi/xsd/2016-01-14-beta\">\n" +
        "      <companyHandle>" + companyHandle + "</companyHandle>\n" +
        "      <assetMoveArray>\n" +
        "        <items>\n" +
        "          <assetHandle>" + assetHandle + "</assetHandle>\n" +
        "          <folderHandle>f|" + folderPath + "</folderHandle>\n" +
        "        </items>\n" +
        "      </assetMoveArray>\n" +
        "    </moveAssetsParam>\n" +
        "  </SOAP-ENV:Body>\n" +
        "</SOAP-ENV:Envelope>";

    return payload;
}

function creatFolderPayload(companyHandle, folderPath){
    //EAEM/adobe/one/two/

    let payload = "<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
        "  <SOAP-ENV:Header>\n" +
        "    <authHeader xmlns=\"http://www.scene7.com/IpsApi/xsd/2016-01-14-beta\">\n" +
        "      <user>" + S7_USER + "</user>\n" +
        "      <password>" + S7_PASS + "</password>\n" +
        "      <locale>en-US</locale>\n" +
        "      <appName>Experience AEM</appName>\n" +
        "      <appVersion>1.0</appVersion>\n" +
        "      <faultHttpStatusCode>200</faultHttpStatusCode>\n" +
        "    </authHeader>\n" +
        "  </SOAP-ENV:Header>\n" +
        "  <SOAP-ENV:Body>\n" +
        "    <createFolderParam xmlns=\"http://www.scene7.com/IpsApi/xsd/2016-01-14-beta\">\n" +
        "      <companyHandle>" + companyHandle + "</companyHandle>\n" +
        "      <folderPath>" + folderPath + "</folderPath>\n" +
        "    </createFolderParam>\n" +
        "  </SOAP-ENV:Body>\n" +
        "</SOAP-ENV:Envelope>";
}
