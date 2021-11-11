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

const SPAIncludeLazy = loadable(() => import('./SPAIncludeLazy'), {fallback: <></>});

const AEMSPAInclude: FC<SPAIncludeProps> = props => {
    return (
        <SPAIncludeLazy {...props} />
    );
};

export default MapTo('eaem-spa-page-include/components/spa-include')(AEMSPAInclude, SPAIncludeConfig);

