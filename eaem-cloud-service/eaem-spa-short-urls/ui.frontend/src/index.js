import 'react-app-polyfill/stable';
import 'react-app-polyfill/ie9';
import 'custom-event-polyfill';

import {Constants, ModelClient, ModelManager} from '@adobe/aem-spa-page-model-manager';
import {createBrowserHistory} from 'history';
import React from 'react';
import {render} from 'react-dom';
import {Router} from 'react-router-dom';
import App from './App';
import LocalDevModelClient from './LocalDevModelClient';
import './components/import-components';
import './index.css';

class ShortURLModelClient extends ModelClient {
    fetch(modelPath) {
        //if the path does not start with /content (page editing) or /conf (template editing) return empty model
        if (modelPath && !/^\/content|^\/conf/.test(modelPath)) {
            return Promise.resolve({});
        } else {
            return super.fetch(modelPath);
        }
    }
}

const modelManagerOptions = {};

if (process.env.REACT_APP_PROXY_ENABLED) {
    modelManagerOptions.modelClient = new LocalDevModelClient(process.env.REACT_APP_API_HOST);
} else {
    modelManagerOptions.modelClient = new ShortURLModelClient(process.env.REACT_APP_API_HOST);
}

const renderApp = () => {
    ModelManager.initialize(modelManagerOptions).then(pageModel => {
        const history = createBrowserHistory();
        render(
            <Router history={history}>
                <App
                    history={history}
                    cqChildren={pageModel[Constants.CHILDREN_PROP]}
                    cqItems={pageModel[Constants.ITEMS_PROP]}
                    cqItemsOrder={pageModel[Constants.ITEMS_ORDER_PROP]}
                    cqPath={pageModel[Constants.PATH_PROP]}
                    locationPathname={window.location.pathname}
                />
            </Router>,
            document.getElementById('spa-root')
        );
    });
};


document.addEventListener('DOMContentLoaded', () => {

    renderApp();
});
