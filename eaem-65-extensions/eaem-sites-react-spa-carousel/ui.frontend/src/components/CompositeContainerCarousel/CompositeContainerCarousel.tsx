import React from "react";
import { MapTo, Container } from "@adobe/cq-react-editable-components";

class CompositeContainerCarousel extends Container {
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

        containerProps.ref = "eaemSlickSlider";

        return containerProps;
    }

    componentDidUpdate() {
        //@ts-ignore
        let eaemProps = this.props;

        if (!eaemProps.isInEditor) {
            return;
        }

        fetch(eaemProps.cqPath + ".json").then(res => res.json())
            .then((rData) => {
                if (rData.collpaseSlidesInEdit == "true") {
                    window.location.reload();
                }
            });
    }

    attachSlick() {
        //@ts-ignore
        let eaemProps = this.props;

        if (!eaemProps.isInEditor) {
            //@ts-ignore
            $(this.refs.eaemSlickSlider).slick();
        } else {
            fetch(eaemProps.cqPath + ".json").then(res => res.json())
                .then((rData) => {
                    if (rData.collpaseSlidesInEdit == "true") {
                        //@ts-ignore
                        $(this.refs.eaemSlickSlider).slick();
                    }
                });
        }
    }

    getCollpaseSlidesInEdit() {
        //@ts-ignore
        let eaemProps = this.props;

    }

    componentDidMount() {
        this.attachSlick();
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
