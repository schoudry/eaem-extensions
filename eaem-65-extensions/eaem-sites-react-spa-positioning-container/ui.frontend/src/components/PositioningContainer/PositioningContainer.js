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

        if( bgProps.overlayOpacity ){
            bgStyles["opacity"] = bgProps.overlayOpacity;
        }

        containerProps.style = bgStyles;

        return containerProps;
    }

    get sectionDivProps() {
        let sectionProps = this.props.sectionProps,
            sectionStyles = {};

        sectionStyles["position"] = "absolute";
        sectionStyles["zIndex"] = "1";

        if(sectionProps.sectionBGColor){
            sectionStyles["background-color"] = sectionProps.sectionBGColor;
        }

        if(sectionProps.contentWidth){
            sectionStyles["width"] = sectionProps.contentWidth;
            sectionStyles["text-align"] = "center";
        }

        if(sectionProps.contentAlignment == "Center"){
            sectionStyles["top"] = "50%";
            sectionStyles["left"] = "50%";
            sectionStyles["transform"] = "translate(-50%, -50%)";
        }

        console.log("Sreek", sectionStyles);

        return {
            "style" : sectionStyles
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