const path = require('path');
const fs = require("fs-extra");

const MAP_BUILD_DIR = path.join(__dirname, 'build', "static", "js");

const CLIENTLIB_REACT_JS_DIR = path.join(__dirname,'..', 'ui.apps','src','main','content', 
                            'jcr_root','apps','eaem-spa-extend-model-client','clientlibs', 'clientlib-react', "js");

fs.copySync(MAP_BUILD_DIR, CLIENTLIB_REACT_JS_DIR, {
    dereference: true,
    filter: (filePath) => {
        if (fs.lstatSync(filePath).isDirectory()) {
            return true;
        }
        return path.basename(filePath).startsWith("main.") && path.basename(filePath).endsWith(".map");
    }
});
