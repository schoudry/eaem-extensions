import React from "react";
import {MapTo, withComponentMappingContext, Container, ResponsiveGrid, ComponentMapping} from '@adobe/cq-react-editable-components';

class EAEMContainer extends Container  {
    get containerProps() {
        let containerProps = super.containerProps;

        containerProps.style = {
            "width": '340px',
            "height": '220px',
            "backgroundColor": "#0000ff"
        };

        return containerProps;
    }

    render() {
        console.log("eaem sreek", this.containerProps);

        return (
            <div {...this.containerProps}>
                <div>
                    { this.childComponents }
                </div>
                { this.placeholderComponent }
            </div>
        );
    }
}

export default MapTo('eaem-sites-spa-dm-video-container/components/container')(EAEMContainer);