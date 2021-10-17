import {MappedComponentProperties, MapTo} from "@adobe/aem-react-editable-components";
import React, { FC, useState } from "react";
import Helmet from "react-helmet";
import useScript from 'react-script-hook';
import {AuthoringUtils} from "@adobe/aem-spa-page-model-manager";

const GeoXFConfig = {
    emptyLabel: "Geo XF - Experience AEM",

    isEmpty: function (props: any) {
        return !props;
    }
};

type GeoXFProps = MappedComponentProperties & {
    mboxName ?: string;
}

const isInProxyOrAuthoring = () => process.env.REACT_APP_PROXY_ENABLED || AuthoringUtils.isInEditor()
                || (window.location.search.indexOf("wcmmode=disabled") !== -1)

const GeoXF: FC<GeoXFProps> = props => {
    // @ts-ignore
    window.targetGlobalSettings = {
        cookieDomain: window.location.hostname
    };

    const [html, setHtml] = useState("<div>Loading...</div>");

    const successFn = (offer : any) => {
        const offerJSON = JSON.parse(offer[0].content);

        if (!offerJSON.xfHtmlPath) {
            setHtml("<div>Target Error loading offer : xfHtmlPath not available</div>");
            return;
        }

        let xfHtmlPath = offerJSON.xfHtmlPath;

        if(isInProxyOrAuthoring()){
            xfHtmlPath = xfHtmlPath.substring(xfHtmlPath.indexOf("/content"));
        }

        const respPromise = process.env.REACT_APP_PROXY_ENABLED ? fetch(xfHtmlPath, {
            credentials: 'same-origin',
            headers: {
                'Authorization': process.env.REACT_APP_AEM_AUTHORIZATION_HEADER
            } as any
        }): fetch(xfHtmlPath);

        respPromise.then( response => response.text()).then( (html) => setHtml(html))
    }

    useScript({
        src: '/etc.clientlibs/eaem-spa-geo-target/clientlibs/clientlib-react/resources/at.js',
        onload: () => {
            // @ts-ignore
            window.adobe.target.getOffer({
                mbox: props.mboxName || 'eaem-state-flag-box',
                success: successFn,
                error: () => setHtml("<div>Target Error loading offer</div>")
            })
        }
    });

    return (
        <>
            <Helmet>
                <link rel="preconnect" href="//ags959.tt.omtrdc.net?lang=en"/>
                <link rel="dns-prefetch" href="//ags959.tt.omtrdc.net?lang=en"/>
            </Helmet>

            <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
    );
}

export default MapTo('eaem-spa-geo-target/components/geo-xf')(GeoXF, GeoXFConfig);