import 'react-app-polyfill/stable';
import 'react-app-polyfill/ie9';
import 'custom-event-polyfill';

import { Constants, ModelManager } from '@adobe/aem-spa-page-model-manager';
import { createBrowserHistory } from 'history';
import React from 'react';
import { render, hydrate } from 'react-dom';
import { Router } from 'react-router-dom';
import App from './App';
import LocalDevModelClient from './LocalDevModelClient';
import './components/import-components';
import './index.css';

const modelManagerOptions = {};
if(process.env.REACT_APP_PROXY_ENABLED) {
    modelManagerOptions.modelClient = new LocalDevModelClient(process.env.REACT_APP_API_HOST);
}

const renderApp = () => {
    ModelManager.initialize(modelManagerOptions).then(pageModel => {
        const history = createBrowserHistory();
        render(
            <Router history={history}>
                <App... />
            </Router>,
            document.getElementById('spa-root')
        );
    });
};

const hydrateApp = (initialState) => {
    modelManagerOptions.model = initialState.rootModel;
    ModelManager.initialize(modelManagerOptions).then(pageModel => {
        const history = createBrowserHistory();
        hydrate(
            <Router history={history}>
                <App.../>
            </Router>,
            document.getElementById('spa-root')
        );
    });
}


document.addEventListener('DOMContentLoaded', () => {

    const initialStateScriptTag = document.getElementById('__INITIAL_STATE__');
    if(!!initialStateScriptTag){
        try{
            const initialState = JSON.parse(initialStateScriptTag.innerHTML);
            initialStateScriptTag.remove();
            hydrateApp(initialState);

            console.info('hydrated react DOM');
        }catch(err){
            console.error('failed to parse initial state json! re-rendering output.', err);
            renderApp();
        }
    }else{
        renderApp();
    }
});
