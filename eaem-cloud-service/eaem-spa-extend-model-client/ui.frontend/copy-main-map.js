//this is for chaning the sourceMappingURL in clientlib-react main file
const path = require('path');
const fs = require("fs-extra");
const readline = require('readline');

const PROJECT_FOLDER_NAME = path.basename(path.join(__dirname, '..'));

const MAP_BUILD_DIR = path.join(__dirname, 'build', "static", "js");

const CLIENTLIB_REACT_JS_DIR = path.join(__dirname,'..', 'ui.apps','src','main','content', 
                            'jcr_root','apps', PROJECT_FOLDER_NAME ,'clientlibs', 'clientlib-react', "js");

/*
fs.copySync(MAP_BUILD_DIR, CLIENTLIB_REACT_JS_DIR, {
    dereference: true,
    filter: (filePath) => {
        if (fs.lstatSync(filePath).isDirectory()) {
            return true;
        }
        return path.basename(filePath).startsWith("main.") && path.basename(filePath).endsWith(".map");
    }
});*/

const mainFile = path.join(CLIENTLIB_REACT_JS_DIR, fs.readdirSync(CLIENTLIB_REACT_JS_DIR).filter((fileName) => {
    return fileName.startsWith("main.")
})[0]);

const mainMapPath = "/apps/" + PROJECT_FOLDER_NAME + "/clientlibs/clientlib-react/resources/static/js/" + path.basename(mainFile) + ".map";

async function writeCorrectSourcePath() {
    const fileStream = fs.createReadStream(mainFile);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    let mainFileContent = "";

    for await (const line of rl) {
        if(line.startsWith("//# sourceMappingURL=")){
            mainFileContent = mainFileContent + "//# sourceMappingURL=" + mainMapPath + "\r\n";
            continue;
        }            

        mainFileContent = mainFileContent + line + "\r\n";
    }

    fs.writeFileSync(mainFile, mainFileContent, 'utf-8');
}

writeCorrectSourcePath();
