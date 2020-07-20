'use strict';

const { worker, SourceCorruptError, GenericError } = require('@adobe/asset-compute-sdk');
const { downloadFile } = require("@adobe/httptransfer");
const fetch = require("@adobe/node-fetch-retry");
const fs = require('fs').promises;
const util = require("util");
const sleep = util.promisify(setTimeout);
const AzureStorage = require('azure-storage');

class EAEMPhotoshopService {
    constructor(auth) {
        this.auth = auth;
    }

    async createRendition(sourceURL, renditionStoreUrl){
        const URL = "https://image.adobe.io/pie/psdService/renditionCreate";

        const body = JSON.stringify({
            inputs: [{
                storage: "azure",
                href: sourceURL
            }],
            outputs: [{
                storage: "azure",
                href: renditionStoreUrl,
                type: "image/jpeg",
                "overwrite": true,
                "quality": 7 // generate a high quality rendition
            }]
        });

        const response = await fetch(URL, {
            method: "post",
            body,
            headers: this._headers()
        });

        if (response.ok) {
            const respJSON = await response.json();

            console.log("EAEM Job Status Url: " , respJSON._links.self.href);

            return respJSON._links.self.href;
        }else{
            console.log("EAEM error posting rendition request: " , response);
        }

        return null;
    }

    async checkStatus(statusUrl) {
        const response = await fetch(statusUrl, {
            headers: this._headers()
        });

        if (response.ok) {
            return (await response.json());
        } else {
            console.log("EAEM: Error checking status", response);
        }

        return null;
    }

    _getAzureReadWritePresignedUrl(instructions) {
        const blobService = AzureStorage.createBlobService(instructions["AZURE_STORAGE_ACCOUNT"],
                                    instructions["AZURE_STORAGE_KEY"]);

        const sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: 'racwdl',
                Start: new Date(),
                Expiry: new Date(new Date().getTime() + 60 * 60000) // expire in 1 hour
            }
        };

        const psRenditionPath = "photoshop/" + instructions.userData.path;

        var token = blobService.generateSharedAccessSignature(instructions["AZURE_STORAGE_CONTAINER_NAME"], psRenditionPath,
                                    sharedAccessPolicy);

        return blobService.getUrl(instructions["AZURE_STORAGE_CONTAINER_NAME"], psRenditionPath, token);
    }

    _headers() {
        return {
            "Authorization": `Bearer ${this.auth.accessToken}`,
            "x-api-key": this.auth.clientId,
            "Content-Type": "application/json"
        };
    }
}

exports.main = worker(async (source, rendition, params) => {
    const stats = await fs.stat(source.path);

    if (stats.size === 0) {
        throw new SourceCorruptError('EAEM: Source file is empty');
    }

    console.log("EAEM Process env...", process.env);
    console.log("EAEM Rendition Instructions for the app...", rendition.instructions);

    const SERVICE = new EAEMPhotoshopService(params.auth);
    const psRendUrl = SERVICE._getAzureReadWritePresignedUrl(rendition.instructions);
    const statusUrl = await SERVICE.createRendition(source.url, psRendUrl);

    if(!statusUrl){
        throw new GenericError("EAEM: Error submitting rendition request");
    }

    let retries = rendition.instructions["REND_GEN_STATUS_RETRIES"] || "5";

    retries = parseInt(retries);

    while (true) {
        if(retries-- <= 0){
            console.log("EAEM: Exhausted retries for rendition generation check, quitting now...");
            break;
        }

        const result = await SERVICE.checkStatus(statusUrl);

        if(!result || result.outputs[0].errors){
            console.log("EAEM: Rendition generation failed...", result.outputs[0].errors);
            throw new GenericError("EAEM: Error generating rendition");
        }else if(result.outputs[0].status == "succeeded" ){
            console.log("EAEM: Rendition generation successful, available at : " + rendition.target);
            break;
        }

        await sleep(1000);
    }

    await downloadFile(psRendUrl, rendition.path);
});

