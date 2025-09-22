const https = require('https'); 
const fs = require("fs"); 
 
const AEM_HOST = 'author-p10961-e880305.adobeaemcloud.com'; 
const AEM_TOKEN = "eyJhb";
const FILE_PREFIX = "p10961-e880305"; 
const LOG = "./" + FILE_PREFIX + ".log"; 
const RESULTS_FILE_PATH = "./" + FILE_PREFIX + ".txt"; 
const FAILED_PATHS = "./" + FILE_PREFIX + "-failed.txt"; 
const SUCCESS_PATHS = "./" + FILE_PREFIX + "-success.txt"; 
const QUERY = "/bin/querybuilder.json?path=/content/eaem-random-test&type=cq:Page&p.hits=selective&p.properties=jcr:path&p.limit=-1"
const PROP_1 = "cq:contextHubPath"; 
const PROP_1_VALUE = "/conf/global/settings/cloudsettings/default/contexthub"; 
const PROP_2 = "cq:contextHubSegmentsPath"; 
const PROP_2_VALUE = "/conf/global/settings/wcm/segments"; 
 
startProcess(); 
 
async function startProcess(){ 
    try { 
        let results = await doFetchSyncGet(AEM_HOST, AEM_TOKEN, QUERY);

        let hits = JSON.parse(results).hits;

        for (const hit of hits) {
            writeResultsToFile(hit["jcr:path"]);
        }

        const fileContent = fs.readFileSync(RESULTS_FILE_PATH, 'utf-8'); 
        const lines = fileContent.split('\n'); 
 
        for (const line of lines) { 
            await updateProperty(AEM_HOST, AEM_TOKEN, line.trim()); 
        } 
    } catch (e) { 
        console.error(e); 
    } 
} 

function writeResultsToFile(path){
    fs.appendFileSync(RESULTS_FILE_PATH, path + "\n");
}
 
async function updateProperty(aemHost, aemToken, pagePath) { 
    if(!pagePath){ 
        return; 
    } 
 
    const postData = { 
        [PROP_1]: PROP_1_VALUE, 
        [PROP_2]: PROP_2_VALUE 
    }; 
 
    await doFetchSyncPost(aemHost, aemToken, pagePath, postData); 
} 
 
async function doFetchSyncPost(aemHost, token, path, payload) { 
    let postOptions = { 
        method: "POST", 
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded" 
        }, 
        body: new URLSearchParams(payload), 
    } 
 
    if (aemHost == "localhost") { 
        aemHost = "http://" + aemHost + ":4502"; 
        postOptions.headers["cookie"] = "login-token=" + token; 
    } else { 
        aemHost = "https://" + aemHost; 
        postOptions.headers["Authorization"] = "Bearer " + token; 
    } 
 
    let data; 
 
    try { 
        const response = await fetch(aemHost + path + "/jcr:content", postOptions); 
 
        data = await response.text(); 
 
        writeToSuccess(path); 
 
        logMessage(path + ", Updated : " + PROP_1 + "," + PROP_2); 
    } catch (err) { 
        logMessage("ERROR: " + path + " : " + err.message); 
        console.log(err); 
 
        writeToFailed(path); 
 
        console.log(" ##### BREATHING FOR A SECOND  #################### "); 
        await delay(10000); 
    } 
 
    return data; 
} 

async function doFetchSyncGet(aemHost, token, path){
    let getOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    }

    if(aemHost == "localhost"){
        aemHost = "http://" + aemHost + ":4502";
        getOptions.headers["cookie"] = "login-token=" + token;
    }else{
        aemHost = "https://" + aemHost;
        getOptions.headers["Authorization"] = "Bearer " + token;
    }

    let data = {};

    try{
        const response = await fetch(aemHost + path, getOptions);
        data = await response.text();

        return data;
    }catch(err){
        console.log(err); 
    }

    return data;
}
 
function delay(time) { 
  return new Promise(resolve => setTimeout(resolve, time)); 
} 
 
function writeToFailed(path){ 
    fs.appendFileSync(FAILED_PATHS, path + "\n"); 
} 
 
function writeToSuccess(path){ 
    fs.appendFileSync(SUCCESS_PATHS, path + "\n"); 
} 
 
function logMessage(message){ 
    console.log(message); 
    fs.appendFileSync(LOG, message + "\n"); 
} 
 