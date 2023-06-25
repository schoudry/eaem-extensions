const fs = require('fs');
const https = require('https');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

let LOG = "C:/dev/projects/test/src/nodejs/list-folders-assets.log";
const S7_NA_IPS_HOST = "s7sps1apissl.scene7.com";
const S7_COMPANY_HANDLE = "c|230095";
const FOLDER_PATH = "eaem/one/en";
const S7_USER = "user@domain.com";
const S7_PASS = "pass";

logMessage("\n---------------------------" + new Date() + "------------------------------------\n");

runRecursiveListProcess(FOLDER_PATH);

function runRecursiveListProcess(folderPath){
    let payload = getSearchAssetsParamPayload(S7_COMPANY_HANDLE, folderPath);

    listAssets(folderPath, payload);

    payload = getFolderTreePayload(S7_COMPANY_HANDLE, folderPath);

    makeS7ReadRequest("getFolderTree", payload).then((xml) => {
        const doc = new dom().parseFromString(xml);
        let index = 0;

        for(;;){
            let subFolderParams = getSubFolderViaXPath(++index, doc);

            if(!subFolderParams.path){
                break;
            }

            const INTERVAL = setInterval(() => {
                if(goAhead){
                    clearInterval(INTERVAL);
                    runRecursiveListProcess(subFolderParams.path);
                }
            }, 500);
        }
    }).catch(err => {
        logMessage("ERROR listing folders : " + FOLDER_PATH);
        logMessage(err);
    });
}

function listAssets(folderPath, payload){
    makeS7ReadRequest("searchAssets", payload).then((xml) => {
        const doc = new dom().parseFromString(xml);
        let index = 0;

        logMessage(folderPath);

        for(;;){
            let assetProps = getAssetPropsViaXPath(++index, doc);

            if(!assetProps.assetHandle){
                break;
            }

            totalAssets++;

            logMessage("\t" + assetProps.assetHandle + "," + folderPath + assetProps.name);
        }

        logMessage("Running assets count - " + totalAssets);
    }).catch(err => {
        logMessage("ERROR listing assets  : " + FOLDER_PATH);
        logMessage(err);
    });
}

function getAssetPropsViaXPath(index, doc){
    let assetParams = {};
    const select = xpath.useNamespaces({"eaems7": "http://www.scene7.com/IpsApi/xsd/2016-01-14-beta"});

    let assetHandle = select('//eaems7:searchAssetsReturn/eaems7:assetArray/eaems7:items[' + index + ']/eaems7:assetHandle/text()', doc);
    assetHandle = ( assetHandle && assetHandle.length > 0 ) ? assetHandle[0].nodeValue : "";

    if(assetHandle){
        let name = select('//eaems7:searchAssetsReturn/eaems7:assetArray/eaems7:items[' + index + ']/eaems7:name/text()', doc);
        name = ( name && name.length > 0 ) ? name[0].nodeValue : "";

        assetParams = {
            assetHandle : assetHandle,
            name: name
        }
    }

    return assetParams;
}

function getSubFolderViaXPath(index, doc){
    const select = xpath.useNamespaces({"eaems7": "http://www.scene7.com/IpsApi/xsd/2016-01-14-beta"});
    let subFolderParams = {};

    let path = select('//eaems7:getFolderTreeReturn/eaems7:folders/eaems7:subfolderArray/eaems7:items[' + index + ']/eaems7:path/text()', doc);
    path = ( path && path.length > 0 ) ? path[0].nodeValue : "";

    if(path){
        subFolderParams = {
            path : path
        }
    }

    return subFolderParams;
}

function makeS7ReadRequest(action, payload){
    goAhead = false;

    let options = {
        host: S7_NA_IPS_HOST,
        path: "/scene7/services/IpsApiService",
        method: "POST",
        headers: {
            'SOAPAction': action,
            'Content-Type': 'text/xml',
            'Content-length' : Buffer.byteLength(payload)
        }
    };

    let reqPromise = new Promise(function(resolve, reject) {
        let req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', data => chunks.push(data));

            res.on('end', () => {
                let resBody = Buffer.concat(chunks).toString();

                if(res.statusCode == 200){
                    resBody = resBody.substring(resBody.indexOf("<soapenv:Body>") + "<soapenv:Body>".length)
                    resBody = resBody.substring(0, resBody.indexOf("</soapenv:Body>"));
                    resolve(resBody);
                }else{
                    reject( { statusCode : res.statusCode, resBody : resBody} );
                }

                goAhead = true;
            });
        });

        req.on('error', (e) => {
            reject(e);
            goAhead = true;
        });

        req.write(payload);
        req.end();
    });

    return reqPromise;
}

function getFolderTreePayload(companyHandle, folderPath){
    let payLoad = "<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n" +
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
        "    <getFolderTreeParam xmlns=\"http://www.scene7.com/IpsApi/xsd/2016-01-14-beta\">\n" +
        "      <companyHandle>" + companyHandle + "</companyHandle>\n" +
        "      <folderPath>" + folderPath + "</folderPath>\n" +
        "      <depth>1</depth>\n" +
        "      <assetTypeArray>\n" +
        "        <items>Aco</items>\n" +
        "        <items>AdjustedView</items>\n" +
        "        <items>AnimatedGif</items>\n" +
        "        <items>AssetSet</items>\n" +
        "        <items>Audio</items>\n" +
        "        <items>Cabinet</items>\n" +
        "        <items>Catalog</items>\n" +
        "        <items>Css</items>\n" +
        "        <items>Excel</items>\n" +
        "        <items>Flash</items>\n" +
        "        <items>Font</items>\n" +
        "        <items>Fxg</items>\n" +
        "        <items>IccProfile</items>\n" +
        "        <items>Illustrator</items>\n" +
        "        <items>InDesign</items>\n" +
        "        <items>Image</items>\n" +
        "        <items>ImageSet</items>\n" +
        "        <items>Javascript</items>\n" +
        "        <items>PDFSettings</items>\n" +
        "        <items>LayerView</items>\n" +
        "        <items>MasterVideo</items>\n" +
        "        <items>Pdf</items>\n" +
        "        <items>PostScript</items>\n" +
        "        <items>PowerPoint</items>\n" +
        "        <items>PsdTemplate</items>\n" +
        "        <items>RenderScene</items>\n" +
        "        <items>RenderSet</items>\n" +
        "        <items>Rtf</items>\n" +
        "        <items>SpinSet</items>\n" +
        "        <items>Svg</items>\n" +
        "        <items>Swc</items>\n" +
        "        <items>Template</items>\n" +
        "        <items>Video</items>\n" +
        "        <items>ViewerSwf</items>\n" +
        "        <items>Vignette</items>\n" +
        "        <items>Watermark</items>\n" +
        "        <items>WindowCovering</items>\n" +
        "        <items>Word</items>\n" +
        "        <items>Xml</items>\n" +
        "        <items>Xsl</items>\n" +
        "        <items>Zip</items>\n" +
        "        <items>VideoCaption</items>\n" +
        "      </assetTypeArray>\n" +
        "      <responseFieldArray>\n" +
        "        <items>folders/folderHandle</items>\n" +
        "        <items>folders/path</items>\n" +
        "        <items>folders/subfolderArray</items>\n" +
        "        <items>folders/childLastModified</items>\n" +
        "        <items>folders/hasSubfolders</items>\n" +
        "      </responseFieldArray>\n" +
        "    </getFolderTreeParam>\n" +
        "  </SOAP-ENV:Body>\n" +
        "</SOAP-ENV:Envelope>";

    return payLoad;
}

function getSearchAssetsParamPayload(companyHandle, folderPath){
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
        "    <searchAssetsParam xmlns=\"http://www.scene7.com/IpsApi/xsd/2016-01-14-beta\">\n" +
        "      <companyHandle>" + companyHandle + "</companyHandle>\n" +
        "      <folder>" + folderPath + "</folder>\n" +
        "      <includeSubfolders>false</includeSubfolders>\n" +
        "      <trashState>NotInTrash</trashState>\n" +
        "      <assetTypeArray>\n" +
        "        <items>Aco</items>\n" +
        "        <items>AdjustedView</items>\n" +
        "        <items>AnimatedGif</items>\n" +
        "        <items>AssetSet</items>\n" +
        "        <items>Audio</items>\n" +
        "        <items>Cabinet</items>\n" +
        "        <items>Catalog</items>\n" +
        "        <items>Css</items>\n" +
        "        <items>Excel</items>\n" +
        "        <items>Flash</items>\n" +
        "        <items>Font</items>\n" +
        "        <items>Fxg</items>\n" +
        "        <items>IccProfile</items>\n" +
        "        <items>Illustrator</items>\n" +
        "        <items>InDesign</items>\n" +
        "        <items>Image</items>\n" +
        "        <items>ImageSet</items>\n" +
        "        <items>Javascript</items>\n" +
        "        <items>PDFSettings</items>\n" +
        "        <items>LayerView</items>\n" +
        "        <items>MasterVideo</items>\n" +
        "        <items>Pdf</items>\n" +
        "        <items>PostScript</items>\n" +
        "        <items>PowerPoint</items>\n" +
        "        <items>PsdTemplate</items>\n" +
        "        <items>RenderScene</items>\n" +
        "        <items>RenderSet</items>\n" +
        "        <items>Rtf</items>\n" +
        "        <items>SpinSet</items>\n" +
        "        <items>Svg</items>\n" +
        "        <items>Swc</items>\n" +
        "        <items>Template</items>\n" +
        "        <items>Video</items>\n" +
        "        <items>ViewerSwf</items>\n" +
        "        <items>Vignette</items>\n" +
        "        <items>Watermark</items>\n" +
        "        <items>WindowCovering</items>\n" +
        "        <items>Word</items>\n" +
        "        <items>Xml</items>\n" +
        "        <items>Xsl</items>\n" +
        "        <items>Zip</items>\n" +
        "        <items>VideoCaption</items>\n" +
        "      </assetTypeArray>\n" +
        "      <recordsPerPage>5000</recordsPerPage>\n" +
        "      <resultsPage>1</resultsPage>\n" +
        "      <sortBy>Created</sortBy>\n" +
        "      <sortDirection>Ascending</sortDirection>\n" +
        "      <responseFieldArray>\n" +
        "        <items>assetArray/items/name</items>\n" +
        "        <items>assetArray/items/assetHandle</items>\n" +
        "        <items>assetArray/items/type</items>\n" +
        "        <items>assetArray/items/subType</items>\n" +
        "        <items>totalRows</items>\n" +
        "      </responseFieldArray>\n" +
        "    </searchAssetsParam>\n" +
        "  </SOAP-ENV:Body>\n" +
        "</SOAP-ENV:Envelope>";

    return payload;
}

function logMessage(message){
    console.log(message);
    fs.appendFileSync(LOG, message + "\n");
}
