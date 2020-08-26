import React from 'react';
import {MapTo, withComponentMappingContext, Container, ResponsiveGrid, ComponentMapping} from '@adobe/cq-react-editable-components';
import {Helmet} from "react-helmet";

class EAEMContainer extends Container  {
    get containerProps() {
        let containerProps = super.containerProps;

        containerProps.style = {
            "width": '100%',
            "height": '500px'
        };

        return containerProps;
    }

    get videoDivProps() {
        return {
            "id": "eaem-dm-video-viewer",
            "style": {
                "zIndex": "0",
                "position": "relative"
            }
        };
    }

    get overlayDivProps() {
        return {
            "style" :{
                "position": "absolute",
                "zIndex": "1",
                "top" : "50%",
                "left" : "50%",
                "backgroundColor" : "white"
            }
        };
    }

    componentDidMount() {
        const timer = setInterval((() => {
            if(window.s7viewers){
                clearInterval(timer);
                this.loadVideo()
            }
        }).bind(this), 500);
    }

    loadVideo(){
        new window.s7viewers.VideoViewer({
            "containerId": "eaem-dm-video-viewer",
            "params": {
                "asset": "disneyparksacspoc/sample-rendition-promo-1280x720",
                "serverurl": "http://s7d1.scene7.com/is/image/",
                "videoserverurl": "http://s7d1.scene7.com/is/content/"
            }
        }).init();
    }

    render() {
        return (
            <div {...this.containerProps}>
                <Helmet>
                    <script src="https://s7d1.scene7.com/s7viewers/html5/js/VideoViewer.js"></script>
                </Helmet>

                <div {...this.videoDivProps}>
                    <div {...this.overlayDivProps}>
                        { this.childComponents }
                        { this.placeholderComponent }
                    </div>
                </div>

            </div>
        );
    }
}

export default MapTo('eaem-sites-spa-dm-video-container/components/container')(EAEMContainer);