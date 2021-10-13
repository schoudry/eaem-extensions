import { MapTo } from "@adobe/aem-react-editable-components";
import React, { FC, useState, useEffect } from "react";

const GeoXFConfig = {
    emptyLabel: "Geo XF - Experience AEM",
 
    isEmpty: function (props: any) {
        return !props;
    }
};

const GeoXF: FC = props => {
    return <div style= { { margin: "20px" } }>This is Xf Content</div>;
}    

export default MapTo('eaem-spa-geo-target/components/geo-xf')(GeoXF, GeoXFConfig);