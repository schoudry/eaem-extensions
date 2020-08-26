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
            "style" : {
                ...{
                "position": "absolute",
                "zIndex": "1"
                } ,
                ...this.overlayDivStyle
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
                "asset": this.props.dmVideoEncode,
                "serverurl": this.props.dmServerUrl,
                "videoserverurl": this.props.dmVideoServerUrl
            }
        }).init();
    }

    render() {
        return (
            <div {...this.containerProps}>
                {   this.props.dmVideoPath &&
                    <Helmet>
                        <script src={ this.props.dmVideoViewerPath }></script>
                    </Helmet>
                }

                {   this.props.dmVideoPath  &&
                    <div {...this.videoDivProps}>
                        <div {...this.overlayDivProps}>
                            { this.childComponents }
                            { this.placeholderComponent }
                        </div>
                    </div>
                }

                {   !this.props.dmVideoPath &&
                    <div>
                        { this.childComponents }
                        { this.placeholderComponent }
                    </div>
                }
            </div>
        );
    }
}

export default MapTo('eaem-sites-spa-dm-video-container/components/container')(EAEMContainer);