import React from 'react';
import {MapTo, withComponentMappingContext, Container, ResponsiveGrid, ComponentMapping} from '@adobe/cq-react-editable-components';

class EAEMPositioningContainer extends Container  {

    get containerProps() {
        let containerProps = super.containerProps;

        console.log("sreek", this.props);

        this.props.positioningContainerProps = this.props.positioningContainerProps || {};

        containerProps.style = {
            "width": '100%',
            "height": '500px'
        };

        return containerProps;
    }

    get backgroundDivProps() {
        return {
            "style": {
                "zIndex": "0",
                "position": "relative"
            }
        };
    }

    get overlayDivProps() {
        return {
            "style" : {
                ...{
                    "position": "absolute",
                    "zIndex": "1"
                } ,
                ...this.props.overlayDivStyle
            }
        };
    }

    render() {
        return (
            <div {...this.containerProps}>
                {   ( this.props.positioningContainerProps.backgroundType == "IMAGE" ) &&
                <div {...this.backgroundDivProps}>
                    <div {...this.overlayDivProps}>
                        { this.childComponents }
                        { this.placeholderComponent }
                    </div>
                </div>
                }

                {   (!this.props.positioningContainerProps.backgroundType
                        || (this.props.positioningContainerProps.backgroundType == "NONE"  ))&&
                <div>
                    { this.childComponents }
                    { this.placeholderComponent }
                </div>
                }
            </div>
        );
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/positioning-container')(EAEMPositioningContainer);