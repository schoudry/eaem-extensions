import { MapTo } from '@adobe/cq-react-editable-components';
import DOMPurify from 'dompurify';
import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { useState, useEffect } from 'react';
import CSS from 'csstype';

function isObjectEmpty(obj){
    return (Object.keys(obj).length == 0);
}

function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width : window.innerWidth,
                height: window.innerHeight,
            });
        }

        window.addEventListener("resize", handleResize);

        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    });

    return windowSize;
}

const ImageEditConfig = {
    emptyLabel: 'Dynamic Media Smart Crop Image - Experience AEM',

    isEmpty: function (props) {
        return (!props || !props.fileReference || (props.fileReference.trim().length < 1));
    }
};

class Image extends Component {
    get imageHTML() {
        const imgStyles : CSS.Properties = {
            marginLeft: 'auto',
            marginRight: 'auto'
        };

        const imageProps = this.props as any;
        const size : any = useWindowSize();
        let imageSrc = imageProps.fileReference;

        if(!isObjectEmpty(imageProps.smartCrops)){
            const breakPoints = Object.keys(imageProps.smartCrops).sort((a : any,b : any) => b-a);

            console.log(breakPoints);

            for(const bp in breakPoints){
                if(bp < size.width){
                    imageSrc = imageProps.smartCrops[bp];
                    break;
                }
            }
        }

        return (
            <div>
                <Link to={imageProps.imageLink}>
                    <img src={imageProps.fileReference} style={imgStyles} />
                </Link>
            </div>
        );
    }

    render() {
        return this.imageHTML;
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/dm-image-smart-crop')(Image, ImageEditConfig);
