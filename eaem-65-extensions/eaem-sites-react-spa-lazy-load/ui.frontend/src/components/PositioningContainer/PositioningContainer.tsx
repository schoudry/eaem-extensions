import React from "react";
import CSS from 'csstype';
import { MapTo, Container } from "@adobe/cq-react-editable-components";

class EAEMPositioningContainer extends Container {
    OVERLAY_POSITION = {
        TOP: "10%",
        BOTTOM: "80%",
        LEFT: "20%",
        EXTREME_LEFT: "5%",
        RIGHT: "20%",
        EXTREME_RIGHT: "5%"
    };

    constructor(props: any) {
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
        let rhProps = this.props;

        rhProps.backgroundProps = rhProps.backgroundProps || {};
        rhProps.sectionProps = rhProps.sectionProps || {};

        let bgProps = rhProps.backgroundProps;

        const bgStyles: CSS.Properties = {
            zIndex: 0,
            position: "relative"
        };

        bgStyles.width = "100%";
        bgStyles.height = bgProps.backgroundHeight;
        bgStyles.backgroundColor = bgProps.backgroundColor;
        bgStyles.opacity = bgProps.overlayOpacity;

        if (bgProps.backgroundType == "IMAGE" && bgProps.backgroundImage) {
            bgStyles.backgroundImage = 'url("' + bgProps.backgroundImage + '")';
            //bgStyles.backgroundRepeat = "no-repeat";
        }

        containerProps.style = bgStyles;

        return containerProps;
    }

    get sectionStyles() {
        //@ts-ignore
        let rhProps = this.props;

        let sectionProps = rhProps.sectionProps;

        const sectionStyles: CSS.Properties = {
            zIndex: 1,
            position: "absolute"
        };

        sectionStyles.backgroundColor = sectionProps.sectionBGColor || undefined;
        sectionStyles.height = sectionProps.sectionHeight || undefined;

        if (sectionProps.contentWidth) {
            sectionStyles.width = sectionProps.contentWidth;
            sectionStyles.textAlign = "center";
        }

        let contentAlignment = sectionProps.contentAlignment || "";

        if (contentAlignment == "Center") {
            sectionStyles.top = "50%";
            sectionStyles.left = "50%";
            sectionStyles.transform = "translate(-50%, -50%)";
        } else {
            contentAlignment = contentAlignment.split(",");

            contentAlignment.map((alignment: string) => {
                alignment = alignment.trim();

                if (alignment == "Top") {
                    sectionStyles["top"] = this.OVERLAY_POSITION.TOP;
                } else if (alignment == "Bottom") {
                    sectionStyles["top"] = this.OVERLAY_POSITION.BOTTOM;
                } else if (alignment == "Extreme Left") {
                    sectionStyles["left"] = this.OVERLAY_POSITION.EXTREME_LEFT;
                } else if (alignment == "Left") {
                    sectionStyles["left"] = this.OVERLAY_POSITION.LEFT;
                } else if (alignment == "Extreme Right") {
                    sectionStyles["right"] = this.OVERLAY_POSITION.EXTREME_RIGHT;
                } else if (alignment == "Right") {
                    sectionStyles["right"] = this.OVERLAY_POSITION.RIGHT;
                }
            });
        }

        return sectionStyles;
    }

    render() {
        return (
            <div {...this.containerProps}>
                <div style={this.sectionStyles}>
                    {this.childComponents}
                    {this.placeholderComponent}
                </div>
            </div>
        );
    }
}

export default MapTo("eaem-sites-spa-how-to-react/components/positioning-container")(
    EAEMPositioningContainer
);
