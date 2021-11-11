import {FC} from "react";
import loadable from "@loadable/component";
import {MappedComponentProperties, MapTo} from "@adobe/aem-react-editable-components";
import React from "react";

const SPAIncludeConfig = {
    emptyLabel: "SPA Include Component",

    isEmpty: function (props: any) {
        return !props || !props.pagePath;
    }
};

type SPAIncludeProps = MappedComponentProperties & {
    pagePath?: string | "";
};

const SPAInclude = loadable(() => import('./SPAInclude'), {fallback: <></>});

const AEMSPAInclude: FC<SPAIncludeProps> = props => {
    return (
        <SPAInclude {...props} />
    );
};

export default MapTo('eaem-spa-page-include/components/spa-include')(AEMSPAInclude, SPAIncludeConfig);

