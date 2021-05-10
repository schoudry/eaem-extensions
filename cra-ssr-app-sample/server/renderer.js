import React from 'react'
import ReactDOMServer from 'react-dom/server'

import Hello from '../src/Hello';

const path = require("path");
const fs = require("fs");

export default (req, res, next) => {
    const indexHtmlFilePath = path.resolve(__dirname, '..', 'build', 'index.html');

    fs.readFile(indexHtmlFilePath, 'utf8', (loadErr, htmlData) => {
        try{
            if (loadErr) {
                throw { message :  "error loading index html" };
            }
            
            const name = req.body.name;

            //pass "name" here for server side rendering, similarly the name is passed in src/index.js for client side rendering
            const component = ReactDOMServer.renderToString(<Hello name={name} />);
    
            //make this data available to client side rendering in src/index.js
            htmlData = htmlData.replace("EAEM_INITIAL_DATA_OBJECT", JSON.stringify({ name : name}));
    
            htmlData = htmlData.replace('<div id="root"></div>',`<div id="root">${component}</div>`)
    
            return res.send(htmlData);
        }catch(err){
            return res.status(500).send('Error processing request - ' + err.message);
        }
    });
}