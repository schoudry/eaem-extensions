import React from 'react';
import {MapTo, Container} from '@adobe/cq-react-editable-components';

class EAEMPositioningContainer extends Container  {
    readonly TOP = "10%";
    readonly BOTTOM = "80%";
    readonly LEFT = "20%";
    readonly EXTREME_LEFT = "5%";
    readonly RIGHT = "20%";
    readonly EXTREME_RIGHT = "5%";

    constructor(props:any) {
        super(props);

        //@ts-ignore
        this.props = props;
    }

    get childComponents() {
        return super.childComponents;
    }

    get placeholderComponent() {
        return super.placeholderComponent;
    }

    get containerProps() {
        let containerProps = super.containerProps;

        //@ts-ignore
        let eaemProps = this.props;

        eaemProps.backgroundProps = eaemProps.backgroundProps || {};
        eaemProps.sectionProps = eaemProps.sectionProps || {};

        let bgProps = eaemProps.backgroundProps;

        let bgStyles = {
            "zIndex": "0",
            "position": "relative",
            "width": "100%",
            "height": bgProps.backgroundHeight
        };

        if( (bgProps.backgroundType == "IMAGE") && bgProps.backgroundImage){
            bgStyles["background-image"] = 'url("' + bgProps.backgroundImage + '")';
            bgStyles["background-repeat"] = 'no-repeat';
        }else if(bgProps.backgroundColor){
            bgStyles["background-color"] = bgProps.backgroundColor;
        }

        if( bgProps.overlayOpacity ){
            bgStyles["opacity"] = bgProps.overlayOpacity;
        }

        containerProps.style = bgStyles;

        return containerProps;
    }

    get sectionDivProps() {
        //@ts-ignore
        let eaemProps = this.props;

        let sectionProps = eaemProps.sectionProps,
            sectionStyles = {};

        sectionStyles["position"] = "absolute";
        sectionStyles["zIndex"] = "1";

        if(!this.childComponents || (this.childComponents.length == 0)){
            return {
                "style" : sectionStyles
            };
        }

        if(sectionProps.sectionBGColor){
            sectionStyles["background-color"] = sectionProps.sectionBGColor;
        }

        if(sectionProps.contentWidth){
            sectionStyles["width"] = sectionProps.contentWidth;
            sectionStyles["text-align"] = "center";
        }

        let contentAlignment = sectionProps.contentAlignment || "";

        if(contentAlignment == "Center"){
            sectionStyles["top"] = "50%";
            sectionStyles["left"] = "50%";
            sectionStyles["transform"] = "translate(-50%, -50%)";
        }else{
            contentAlignment = contentAlignment.split(",");

            contentAlignment.map((alignment, index) => {
                alignment = alignment.trim();

                if(alignment == "Top"){
                    sectionStyles["top"] = this.TOP;
                }else if(alignment == "Bottom"){
                    sectionStyles["top"] = this.BOTTOM;
                }else if(alignment == "Extreme Left"){
                    sectionStyles["left"] = this.EXTREME_LEFT;
                }else if(alignment == "Left"){
                    sectionStyles["left"] = this.LEFT;
                }else if(alignment == "Extreme Right"){
                    sectionStyles["right"] = this.EXTREME_RIGHT;
                }else if(alignment == "Right"){
                    sectionStyles["right"] = this.RIGHT;
                }
            })
        }

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
        )
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/positioning-container')(EAEMPositioningContainer);