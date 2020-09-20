import React from "react";
import { MapTo, Container } from "@adobe/cq-react-editable-components";

class CompositeContainerCarousel extends Container {
    constructor(props: any) {
        super(props);
    }

    get childComponents() {
        return super.childComponents;
    }

    get placeholderComponent() {
        return super.placeholderComponent;
    }

    get containerProps() {
        let containerProps = super.containerProps;

        containerProps.ref =  "eaemSlickSlider";

        return containerProps;
    }

    componentDidMount() {
        //@ts-ignore
        $($(this.refs.eaemSlickSlider)).slick();
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
    CompositeContainerCarousel
);
