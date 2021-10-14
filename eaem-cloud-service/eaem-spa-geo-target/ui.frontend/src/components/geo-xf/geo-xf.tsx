import { MapTo } from "@adobe/aem-react-editable-components";
import React, { FC, useState, useEffect } from "react";

const GeoXFConfig = {
    emptyLabel: "Geo XF - Experience AEM",

    isEmpty: function (props: any) {
        return !props;
    }
};

const GeoXF: FC = props => {

    const [html, setHtml] = useState("<div>Loading...</div>");

    useEffect(() => {
        const XF_URL = '/content/experience-fragments/eaem-spa-geo-target/us/en/site/experience-aem/master.html?wcmmode=disabled';

        const respPromise = process.env.REACT_APP_PROXY_ENABLED ? fetch(XF_URL, {
            credentials: 'same-origin',
            headers: {
                'Authorization': process.env.REACT_APP_AEM_AUTHORIZATION_HEADER
            } as any
        }): fetch(XF_URL);

        respPromise.then(response => response.text()).then(html => setHtml(html))

      }, []);

    return <div dangerouslySetInnerHTML={{ __html: html }} />;;
}

export default MapTo('eaem-spa-geo-target/components/geo-xf')(GeoXF, GeoXFConfig);