import { MapTo } from "@adobe/aem-react-editable-components";
import React, { FC, useState, useEffect } from "react";
import Helmet from "react-helmet";

const GeoXFConfig = {
    emptyLabel: "Geo XF - Experience AEM",

    isEmpty: function (props: any) {
        return !props;
    }
};

const GeoXF: FC = props => {
    const [html, setHtml] = useState("<div>Loading...</div>");

    useEffect(() => {
        // @ts-ignore
        window.adobe.target.getOffer({
            mbox: 'eaem-state-flag-box',
            success: (offer : any) => setHtml(offer[0].content),
            error: () => setHtml("<div>Target Error loading offer</div>")
        })
      }, []);

    return (
        <>
            <Helmet>
                <link rel="preconnect" href="//ags959.tt.omtrdc.net?lang=en"/>
                <link rel="dns-prefetch" href="//ags959.tt.omtrdc.net?lang=en"/>
                <script src="/etc.clientlibs/eaem-spa-geo-target/clientlibs/clientlib-react/resources/at.js"></script>
            </Helmet>

            <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
    );
}

export default MapTo('eaem-spa-geo-target/components/geo-xf')(GeoXF, GeoXFConfig);