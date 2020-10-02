import { MapTo } from '@adobe/cq-react-editable-components';
import DOMPurify from 'dompurify';
import React, { Component } from 'react';
import {Link} from "react-router-dom";

const ImageEditConfig = {
    emptyLabel: 'Dynamic Media Smart Crop Image - Experience AEM',

    isEmpty: function (props) {
        return (!props || !props.fileReference || (props.fileReference.trim().length < 1));
    }
};

class Image extends Component {
    componentDidMount() {
    }

    get imageHTML() {
        const imgStyles = {
            "display": 'block',
            "margin-left": 'auto',
            "margin-right": 'auto'
        };

        var imageProps = this.props as any;

        return (
            <div>
                <Link to={imageProps.imageLink}>
                    <img src={imageProps.fileReference} style={imgStyles}/>
                </Link>
            </div>
        );
    }

    render() {
        return this.imageHTML;
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/dm-image-smart-crop')(Image,ImageEditConfig);
