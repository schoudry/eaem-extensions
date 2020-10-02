import { MapTo } from '@adobe/cq-react-editable-components';
import DOMPurify from 'dompurify';
import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { useState, useEffect } from 'react';
import CSS from 'csstype';

function isObjectEmpty(obj){
    return (Object.keys(obj).length == 0);
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
        let imageSrc = imageProps.fileReference;

        if(!isObjectEmpty(imageProps.smartCrops)){
            const breakPoints = Object.keys(imageProps.smartCrops).sort((a : any,b : any) => b-a);

            for(const i in breakPoints){
                let bp = parseInt(breakPoints[i]);

                if(bp < window.innerWidth){
                    imageSrc = imageProps.smartCrops[bp];

                    break;
                }
            }
        }

        return (
            <div>
                <Link to={imageProps.imageLink}>
                    <img src={imageSrc} style={imgStyles} />
                </Link>
            </div>
        );
    }

    render() {
        return this.imageHTML;
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/dm-image-smart-crop')(Image, ImageEditConfig);
