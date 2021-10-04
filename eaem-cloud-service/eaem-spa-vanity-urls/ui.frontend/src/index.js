import 'react-app-polyfill/stable';
import 'react-app-polyfill/ie9';
import 'custom-event-polyfill';

import { Constants, ModelManager } from '@adobe/aem-spa-page-model-manager';
import { createBrowserHistory } from 'history';
import React from 'react';
import { render } from 'react-dom';
import { Router } from 'react-router-dom';
import App from './App';
import LocalDevModelClient from './LocalDevModelClient';
import './components/import-components';
import './index.css';

const modelManagerOptions = {};

if(process.env.REACT_APP_PROXY_ENABLED) {
    modelManagerOptions.modelClient = new LocalDevModelClient(process.env.REACT_APP_API_HOST);
}

const getVanityUrls = async () => {
    const QUERY = "/bin/querybuilder.json?path=/content/eaem-spa-vanity-urls&property=jcr:content/sling:vanityPath&property.operation=exists" +
        "&p.hits=selective&p.properties=jcr:content/sling:vanityPath%20jcr:path&type=cq:Page";

    const response = await fetch(QUERY);

    const data = (await response.json()).hits.reduce((first, second) => {
        return { ...first, ...{ [second["jcr:path"]]: second["jcr:content"]?.["sling:vanityPath"] } }
    }, {});

    return data;
};

const renderApp = (vanityUrls) => {
    ModelManager.initialize(modelManagerOptions).then(pageModel => {
        const history = createBrowserHistory();
        render(
            <Router history={history}>
                <App
                    vanityUrls={vanityUrls}
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
    getVanityUrls().then((vanityUrls) => {
        renderApp(vanityUrls);
    });
});
