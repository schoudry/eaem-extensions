const {
    FileSystemUploadOptions,
    FileSystemUpload
} = require('@adobe/aem-upload');

const AEM = "https://author-p10961-e880305.adobeaemcloud.com"
const AEM_TOKEN = "eyJhbGc...";

const UPLOAD_FOLDER = "/content/dam/aem-upload";
const LOCAL_FILE_PATH = "C:/Users/nalabotu/Pictures/bricks.jpeg";

const options = new FileSystemUploadOptions()
    .withUrl(AEM + UPLOAD_FOLDER)
    .withHeaders({
        Authorization: 'Bearer ' + AEM_TOKEN
    });

const fileUpload = new FileSystemUpload();
fileUpload.upload(options, [
    LOCAL_FILE_PATH
]).then(() =>
    console.log(`Upload Success`)
).catch((err) =>
    console.error("Upload Failed", err)
);