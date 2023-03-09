const https = require('https');
const S7_NA_IPS_HOST = "s7sps1apissl.scene7.com";
const S7_COMPANY_HANDLE = "c|999999"; 
const FOLDER_PATH = "EAEM/one/two/three";
const S7_USER = "user@domain.com";
const S7_PASS = "password";

runCreateProcess();

function runCreateProcess(){
    let payload = creatFolderPayload(S7_COMPANY_HANDLE, FOLDER_PATH);

    makeS7Request(payload).then((data) => {
        console.log("CREATED Folder : ", FOLDER_PATH);
        console.log(data);
    }).catch(err => {
        console.log("ERROR Creating Folder : ", FOLDER_PATH);
        console.log(err)
    });
}

function makeS7Request(payload){
    let options = {
        host: S7_NA_IPS_HOST,
        path: "/scene7/services/IpsApiService",
        method: "POST",
        headers: {
            'SOAPAction': "createFolder",
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
                    if(resBody.indexOf("<errorCount>1</errorCount>") > 0){
                        console.log("\t" + resBody);
                    }
                    resolve(resBody);
                }else{
                    reject(resBody, res.statusCode);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(payload);
        req.end();
    });

    return reqPromise;
}

function creatFolderPayload(companyHandle, folderPath){
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

    return payload;
}