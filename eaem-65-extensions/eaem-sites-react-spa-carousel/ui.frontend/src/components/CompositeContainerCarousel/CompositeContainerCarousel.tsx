import React from "react";
import CSS from 'csstype';
import { MapTo, Container } from "@adobe/cq-react-editable-components";
import { Console } from "console";

class EAEMPositioningContainer extends Container {
    constructor(props: any) {
        super(props);

        //@ts-ignore
        this.props = props;

        console.log("sreeklanth");
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

        return containerProps;
    }

    render() {
        return (
            <div {...this.containerProps}>
                {this.childComponents}
                {this.placeholderComponent}
            </div>
        );
    }
}

export default MapTo("eaem-sites-spa-how-to-react/components/composite-container-carousel")(
    EAEMPositioningContainer
);
