import React, { FC, useState, useEffect, Component, ComponentType } from "react";
import CSS from 'csstype';
import { MapTo, Container } from "@adobe/cq-react-editable-components";

interface EAEMContainerPropTypes {
    containerProps: any,
    childComponents: any,
    placeholderComponent: any
}

const EAEMContainerWrapper = (Component: React.FC<any>) => class EAEMContainer extends Container<any, any> {
    props: any

    constructor(props: any) {
        super(props);
        this.props = props;
    }

    render() {
        return (
            <Component {...Object.assign({}, this.props, {
                containerProps: super.containerProps,
                childComponents: super.childComponents,
                placeholderComponent: super.placeholderComponent
            })}>
            </Component>
        );
    }
}

const OVERLAY_POSITION = {
    TOP: "10%",
    BOTTOM: "80%",
    LEFT: "20%",
    EXTREME_LEFT: "5%",
    RIGHT: "20%",
    EXTREME_RIGHT: "5%"
};

function getSectionPropsStyle(eaemProps) {
    let sectionProps = eaemProps.sectionProps;

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
                sectionStyles["top"] = OVERLAY_POSITION.TOP;
            } else if (alignment == "Bottom") {
                sectionStyles["top"] = OVERLAY_POSITION.BOTTOM;
            } else if (alignment == "Extreme Left") {
                sectionStyles["left"] = OVERLAY_POSITION.EXTREME_LEFT;
            } else if (alignment == "Left") {
                sectionStyles["left"] = OVERLAY_POSITION.LEFT;
            } else if (alignment == "Extreme Right") {
                sectionStyles["right"] = OVERLAY_POSITION.EXTREME_RIGHT;
            } else if (alignment == "Right") {
                sectionStyles["right"] = OVERLAY_POSITION.RIGHT;
            }
        });
    }

    return sectionStyles;
}

function getContainerPropsStyle(eaemProps) {
    eaemProps.backgroundProps = eaemProps.backgroundProps || {};
    eaemProps.sectionProps = eaemProps.sectionProps || {};

    let bgProps = eaemProps.backgroundProps;

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
    }

    return bgStyles;
}

const EAEMPositioningContainer: FC<EAEMContainerPropTypes> = ({ containerProps, childComponents, placeholderComponent, ...props }) => {
    containerProps.style = getContainerPropsStyle({ ...props });

    return (
        <div {...containerProps}>
            <div style={getSectionPropsStyle({...props})}>
                {childComponents}
                {placeholderComponent}
            </div>
        </div>
    );
};

export default MapTo("eaem-sites-spa-how-to-react/components/positioning-container")(
    EAEMContainerWrapper(EAEMPositioningContainer)
);
