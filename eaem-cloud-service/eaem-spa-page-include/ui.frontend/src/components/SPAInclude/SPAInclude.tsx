import {FC} from "react";
import * as React from "react";

type SPAIncludeProps = {
    pagePath ?: string;
};

const SPAInclude: FC<SPAIncludeProps> = props => {
    const styles : React.CSSProperties = {
        padding: "40px",
        textAlign: "center"
    }

    let html = <div style={ styles }>Select the page path in dialog</div>

    if (props.pagePath) {
        html = <div style={ styles }>Browser refresh the page...</div>
    }

    return html;
};

export default SPAInclude;
