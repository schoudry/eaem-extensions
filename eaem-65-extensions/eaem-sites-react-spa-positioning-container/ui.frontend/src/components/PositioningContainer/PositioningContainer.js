import React from 'react';
import {MapTo, withComponentMappingContext, Container, ResponsiveGrid, ComponentMapping} from '@adobe/cq-react-editable-components';

class EAEMPositioningContainer extends Container  {

    get containerProps() {
        let containerProps = super.containerProps;

        this.props.backgroundProps = this.props.backgroundProps || {};
        this.props.sectionProps = this.props.sectionProps || {};

        let bgProps = this.props.backgroundProps;

        let bgStyles = {
            "zIndex": "0",
            "position": "relative",
            "width": "100%",
            "height": bgProps.backgroundHeight
        };

        if( (bgProps.backgroundType == "IMAGE") && bgProps.backgroundImage){
            bgStyles["background-image"] = 'url("' + bgProps.backgroundImage + '")';
            bgStyles["background-repeat"] = 'no-repeat';
        }

        containerProps.style = bgStyles;

        return containerProps;
    }

    get sectionDivProps() {
        return {
            "style" : {
                "position": "absolute",
                "zIndex": "1"
            }
        };
    }

    render() {
        return (
            <div {...this.containerProps}>
                <div {...this.sectionDivProps}>
                    { this.childComponents }
                    { this.placeholderComponent }
                </div>
            </div>
        );
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/positioning-container')(EAEMPositioningContainer);