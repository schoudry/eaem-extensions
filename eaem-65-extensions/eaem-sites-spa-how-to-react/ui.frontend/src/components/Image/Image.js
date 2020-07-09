import { MapTo } from '@adobe/cq-react-editable-components';
import DOMPurify from 'dompurify';
import React, { Component } from 'react';
import {Link} from "react-router-dom";

const ImageEditConfig = {
    emptyLabel: 'Image - Experience AEM',

    isEmpty: function (props) {
        return !props || !props.imageURL || props.imageURL.trim().length < 1;
    }
};

class Image extends Component {
    get imageHTML() {
        const imgStyles = {
            "display": 'block',
            "margin-left": 'auto',
            "margin-right": 'auto'
        };

        return (
            <div>
                <Link to={this.props.imageLink}>
                    <img src={this.props.imageURL} style={imgStyles}/>
                </Link>
            </div>
        );
    }

    render() {
        return this.imageHTML;
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/image')(Image,ImageEditConfig);
