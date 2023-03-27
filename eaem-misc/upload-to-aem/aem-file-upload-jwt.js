const HTTPS = require('https');
const QS = require('querystring');
const JWS = require("jws");
const { FileSystemUploadOptions, FileSystemUpload } = require('@adobe/aem-upload');

const CONFIG_COPIED_FROM_DEV_CONSOLE = {
    "ok": true,
    "integration": {
        "imsEndpoint": "ims-na1.adobelogin.com",
        "metascopes": "ent_aem_cloud_api",
        "technicalAccount": {
            "clientId": "cm-pxxxx-exxxx-integration-1",
            "clientSecret": "p8e-xxx-xxxxxxxxxxxxxAmV"
        },
        "email": "b925c5cexxxxxxxxxxxxb6c9e@techacct.adobe.com",
        "id": "A37Cxxxxxxxxxxxx@techacct.adobe.com",
        "org": "2FBC7BxxxxxxxxxxxxFBB@AdobeOrg",
        "privateKey": "-----BEGIN RSA PRIVATE KEY-----\r\nMIIxxxxxxxxxxxx1MymhgRoYbMfBulvMvnE\r\n-----END RSA PRIVATE KEY-----\r\n",
        "publicKey": "-----BEGIN CERTIFICATE-----\r\nMIIDHDxxxxxxxxxxxx6GlMjx9z+CsOvurM=\r\n-----END CERTIFICATE-----\r\n",
        "certificateExpirationDate": "2024-03-26T16:20:18.000Z"
    },
    "statusCode": 200
}

const PRIVATE_KEY = CONFIG_COPIED_FROM_DEV_CONSOLE["integration"]["privateKey"];
const CLIENT_ID = CONFIG_COPIED_FROM_DEV_CONSOLE["integration"]["technicalAccount"]["clientId"];
const CLIENT_SECRET = CONFIG_COPIED_FROM_DEV_CONSOLE["integration"]["technicalAccount"]["clientSecret"];
const ORG_ID = CONFIG_COPIED_FROM_DEV_CONSOLE["integration"]["org"];
const TECH_ACCOUNT = CONFIG_COPIED_FROM_DEV_CONSOLE["integration"]["id"];
const IMS_HOST = CONFIG_COPIED_FROM_DEV_CONSOLE["integration"]["imsEndpoint"];
const META_SCOPE = "https://" + IMS_HOST + "/s/" + CONFIG_COPIED_FROM_DEV_CONSOLE["integration"]["metascopes"];

const AEM = "https://author-p10961-e880305.adobeaemcloud.com"
const UPLOAD_FOLDER = "/content/dam/aem-upload";
const LOCAL_FILE_PATH = "C:/Users/nalabotu/Pictures/bricks.jpeg";

triggerUploadSteps();

async function triggerUploadSteps(){
    const jwtToken = getJWTToken();

    console.log("jwtToken-----" + jwtToken.substring(0,20) + ".....TRIMMED...");

    let aemToken = await getAEMToken(jwtToken);

    console.log("aemToken-----" + aemToken.substring(0,20) + ".....TRIMMED...");

    doUpload(aemToken);
}

function getAEMToken(jwtToken){
    const postData = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        "jwt_token" : jwtToken
    };

    let payload = QS.stringify(postData);

    const options = {
        hostname: IMS_HOST,
        path: "/ims/exchange/jwt",
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    let reqPromise = new Promise(function(resolve, reject) {
        let req = HTTPS.request(options, (res) => {
            const chunks = [];
            res.on('data', data => chunks.push(data));

            res.on('end', () => {
                let resBody = Buffer.concat(chunks).toString();

                if(res.statusCode == 200){
                    resolve(JSON.parse(resBody)["access_token"]);
                }else{
                    reject( { statusCode : res.statusCode, resBody : resBody} );
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

function getJWTToken(){
    const jwt_payload = {
        iss: ORG_ID,
        sub: TECH_ACCOUNT,
        exp: Math.floor((Date.now() / 1000) + 3600 * 8),
        aud: "https://ims-na1.adobelogin.com/c/" + CLIENT_ID,
        [META_SCOPE]: true
    };

    const jwtToken = JWS.sign({
        header: { alg: 'RS256' },
        payload: jwt_payload,
        secret: PRIVATE_KEY,
    });

    return jwtToken;
}

function doUpload(accessToken){
    const options = new FileSystemUploadOptions()
        .withUrl(AEM + UPLOAD_FOLDER)
        .withHeaders({
            Authorization: 'Bearer ' + accessToken
        });

    const fileUpload = new FileSystemUpload();

    fileUpload.upload(options, [
        LOCAL_FILE_PATH
    ]).then(result => {
        let noErrors = true;

        result.getErrors().forEach(error => {
            noErrors = false;
            console.log("\t" + error);
        });

        result.getFileUploadResults().forEach(fileResult => {
            fileResult.getErrors().forEach(fileErr => {
                noErrors = false;
                console.log("\t" + fileErr);
            });
        });

        if(noErrors){
            console.log("\nUPLOAD SUCCESSFUL\n");
        }else{
            console.error("\nUPLOAD FAILED\n");
        }
    }).catch(err =>
        console.error("\nUPLOAD FAILED\n", err)
    );
}
