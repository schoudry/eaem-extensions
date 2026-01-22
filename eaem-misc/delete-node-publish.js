const QS = require('querystring');

let AUTHOR_HOST = 'author-p10961-e880305.adobeaemcloud.com';
let AEM_TOKEN = "eyJhb......";
let PATH = "/content/eaem-random-test/us/en/jcr:content/root/container/container/helloworld";

(async () => {
    await doDeleteUsingDistribute(PATH);
})();

async function doDeleteUsingDistribute(nodePath){
    const postData = {
        action: 'DELETE',
        path: nodePath
    };

    let payload = QS.stringify(postData);

    try {
        const response = await fetch(`https://${AUTHOR_HOST}/libs/sling/distribution/services/agents/publish`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + AEM_TOKEN,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: payload
        });

        if (response.ok) {
            console.log(response.status + " : DELETED NODE USING SCD : " + nodePath);
        } else {
            console.log("ERROR : " + response.status + " : Failed to delete node using SCD : " + nodePath);
        }
    } catch (e) {
        console.log("ERROR DISTRIBUTE DELETE : " + nodePath + " , " + e);
    }
}


