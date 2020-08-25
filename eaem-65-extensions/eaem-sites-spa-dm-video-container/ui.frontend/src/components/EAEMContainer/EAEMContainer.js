import React from "react";
import {MapTo, withComponentMappingContext, Container, ResponsiveGrid, ComponentMapping} from '@adobe/cq-react-editable-components';

class EAEMContainer extends Container  {
    get containerProps() {
        let containerProps = super.containerProps;
        return containerProps;
    }

    render() {
        console.log("placeholderComponent", this.placeholderComponent);
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

MapTo('eaem-sites-spa-dm-video-container/components/container')(EAEMContainer);