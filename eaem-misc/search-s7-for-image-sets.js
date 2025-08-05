const fs = require('fs');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

let LOG = "C:/dev/projects/test/src/nodejs/list-image-sets.csv";
const S7_NA_IPS_HOST = "https://s7sps1apissl.scene7.com";
const S7_COMPANY_HANDLE = "c|9999";
const S7_USER = "user@domain.com";
const S7_PASS = "pass";

try {
    initLog();

    runSearchProcess();
} catch (err) {
    console.log("ERROR: Listing assets - " + err.message, err);
}

async function runSearchProcess() {
    console.log("Executing search assets in company - " + S7_COMPANY_HANDLE);

    let payload = getSearchAssetsParamPayload(S7_COMPANY_HANDLE);

    console.log("Request Payload  : " + payload);

    const resXml = await doFetchSyncPost("searchAssets", payload);

    const doc = new dom().parseFromString(resXml);
    let index = 0

    for(;;){
        let assetProps = getAssetPropsViaXPath(++index, doc);

        if(!assetProps.assetHandle){
            break;
        }

        logMessage(assetProps.assetHandle + "," + assetProps.name + "," + assetProps.lastModifyUser + "," + assetProps.created + ","
            + assetProps.createUser + "," + assetProps.lastModified + "," + assetProps.folder);
    }
}

async function doFetchSyncPost(action, payload) {
    let postOptions = {
        method: "POST",
        headers: {
            'SOAPAction': action,
            'Content-Type': 'text/xml',
            'Content-length' : Buffer.byteLength(payload)
        },
        body: payload,
    }

    let data;

    try {
        const response = await fetch(S7_NA_IPS_HOST + "/scene7/services/IpsApiService", postOptions);

        data = await response.text();

        data = data.substring(data.indexOf("<soapenv:Body>") + "<soapenv:Body>".length)
        data = data.substring(0, data.indexOf("</soapenv:Body>"));
    } catch (err) {
        console.log("ERROR: making s7 request - " + err.message, err);
    }

    return data;
}

function getAssetPropsViaXPath(index, doc){
    let assetParams = {};
    const select = xpath.useNamespaces({"eaems7": "http://www.scene7.com/IpsApi/xsd/2016-01-14-beta"});

    const assetHandle = getValueFromDoc(select, index, "assetHandle", doc);

    if(assetHandle){
        assetParams = {
            assetHandle : assetHandle,
            name: getValueFromDoc(select, index, "name", doc),
            folder: getValueFromDoc(select, index, "folderHandle", doc),
            created: getValueFromDoc(select, index, "created", doc),
            createUser: getValueFromDoc(select, index, "createUser", doc),
            lastModified: getValueFromDoc(select, index, "lastModified", doc),
            lastModifyUser: getValueFromDoc(select, index, "lastModifyUser", doc)
        }
    }

    return assetParams;
}

function getValueFromDoc(select, index, prop, doc){
    let propE = select('//eaems7:searchAssetsReturn/eaems7:assetArray/eaems7:items[' + index + ']/eaems7:' + prop + '/text()', doc);
    return ( propE && propE.length > 0 ) ? propE[0].nodeValue : "";
}

function getSearchAssetsParamPayload(companyHandle){
    let payload = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        ' <SOAP-ENV:Header>' +
        '  <authHeader xmlns="http://www.scene7.com/IpsApi/xsd/2016-01-14-beta">' +
        '   <user>'+ S7_USER + '</user>' +
        '   <password>' + S7_PASS + '</password>' +
        '   <locale>en-US</locale>' +
        '   <appName>Experience AEM</appName>' +
        '   <appVersion>1.0</appVersion>' +
        '   <faultHttpStatusCode>200</faultHttpStatusCode>' +
        '  </authHeader>' +
        ' </SOAP-ENV:Header>' +
        ' <SOAP-ENV:Body>' +
        '  <searchAssetsParam xmlns="http://www.scene7.com/IpsApi/xsd/2016-01-14-beta">' +
        '   <companyHandle>' + companyHandle + '</companyHandle>' +
        '   <includeSubfolders>true</includeSubfolders>' +
        '    <assetTypeArray>' +
        '     <items>ImageSet</items>' +
        '    </assetTypeArray>' +
        '   <recordsPerPage>100</recordsPerPage>' +
        '   <resultsPage>1</resultsPage>' +
        '  </searchAssetsParam>' +
        ' </SOAP-ENV:Body>' +
        '</SOAP-ENV:Envelope>';

    return payload;
}

function initLog(){
    if(!fs.existsSync(LOG)){
        return;
    }
    fs.unlinkSync(LOG);
    logMessage("Asset Handle, Name, Create User, Created, Last Modified User, Last Modified, Folder")
}

function logMessage(message){
    fs.appendFileSync(LOG, message + "\n");
}