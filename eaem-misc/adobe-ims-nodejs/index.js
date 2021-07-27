var jwt = require('jsonwebtoken');
const qs = require('qs');
const axios = require('axios');

var PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\r\nMIIEowxxx7QxcywpsIwezx0\r\n-----END RSA PRIVATE KEY-----\r\n"
var PUBLIC_KEY = "-----BEGIN CERTIFICATE-----\r\nMIIDxxJInFMCWg==\r\n-----END CERTIFICATE-----\r\n";
var CLIENT_ID = "cm-pxxxxx-exxxx-integration";
var CLIENT_SECRET = "p8xxx2Md";
var ORG_ID = "FAxxx1@AdobeOrg";
var SUBJECT = "24xxx@techacct.adobe.com";

var jwt_payload = {
    iss: ORG_ID,
    sub: SUBJECT,
    exp: Math.floor((Date.now()/1000)+3600*8),
    aud: "https://ims-na1.adobelogin.com/c/" + CLIENT_ID,
    "https://ims-na1.adobelogin.com/s/ent_aem_cloud_api": true
}

var jwt_token = jwt.sign(jwt_payload, PRIVATE_KEY, {algorithm: 'RS256'});

console.log(jwt_token)

console.debug(jwt.verify(jwt_token, PUBLIC_KEY,{ complete: true}));

var body = qs.stringify({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    jwt_token: jwt_token
});

var config = {
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    verbose: "true"
};

var request = axios.create({
    baseURL: "https://ims-na1.adobelogin.com",
    timeout: 10000
});

request.post("/ims/exchange/jwt", body, config).then(res => {
    console.log(res)
}).catch(error => {
    console.error(error)
})
