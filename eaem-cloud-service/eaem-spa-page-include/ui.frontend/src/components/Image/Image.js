import React, { Component } from 'react';
import {Link} from "react-router-dom";
import {MapTo} from "@adobe/aem-react-editable-components";

const ImageEditConfig = {
    emptyLabel: 'Image - Experience AEM',

    isEmpty: function (props) {
        return !props || !props.src;
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
                    <img src={this.props.src} style={imgStyles}/>
                </Link>
            </div>
        );
    }

    render() {
        return this.imageHTML;
    }
}

export default MapTo('eaem-spa-page-include/components/image')(Image,ImageEditConfig);
