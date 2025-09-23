const https = require('https'); 
const fs = require("fs"); 
 
const AEM_HOST = 'author-p10961-e880305.adobeaemcloud.com'; 
const AEM_TOKEN = "eyJhbG";
const FILE_PREFIX = "p10961-e880305"; 
const LOG = "./" + FILE_PREFIX + ".log"; 
const RESULTS_FILE_PATH = "./" + FILE_PREFIX + ".txt"; 
const QUERY = "/bin/querybuilder.json?path=/content/eaem-random-test&type=cq:Page&p.hits=selective&p.properties=jcr:path&p.limit=-1"
const COMMAND = "Deactivate"; // Deactivate, Activate
const AGENT = "publish"; 
 
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
            await publishPage(AEM_HOST, AEM_TOKEN, line.trim()); 
        } 
    } catch (e) { 
        console.error(e); 
    } 
} 

function writeResultsToFile(path){
    fs.appendFileSync(RESULTS_FILE_PATH, path + "\n");
}
 
async function publishPage(aemHost, aemToken, pagePath) { 
    if(!pagePath){ 
        return; 
    } 
 
    const postData = { 
        "path": pagePath, 
        "cmd": COMMAND, 
        "agentId": AGENT, 
        "_charset_": "UTF-8"
    }; 
 
    await doFetchSyncPost(aemHost, aemToken, postData); 
} 
 
async function doFetchSyncPost(aemHost, token, payload) { 
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
        const response = await fetch(aemHost + "/bin/replicate", postOptions); 

        const statusCode = response.status;

        if(statusCode != 200 && statusCode != 201){
            logMessage(statusCode, "- ERROR - ", payload.path);
        }else{
            console.log(statusCode, "-", payload.path);
        }
 
        data = await response.text(); 
    } catch (err) { 
        logMessage("ERROR: " + path + " : " + err.message); 
        console.log(err); 
 
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
 
function logMessage(message){ 
    console.log(message); 
    fs.appendFileSync(LOG, message + "\n"); 
} 
 