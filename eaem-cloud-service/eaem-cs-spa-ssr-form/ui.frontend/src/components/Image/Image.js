import { MapTo } from '@adobe/cq-react-editable-components';
import DOMPurify from 'dompurify';
import React, { Component } from 'react';
import {Link} from "react-router-dom";

const ImageEditConfig = {
    emptyLabel: 'Image - Experience AEM',

    isEmpty: function (props) {
        return (!props || !props.fileReference || (props.fileReference.trim().length < 1));
    }
};

class Image extends Component {
    componentDidMount() {
        //todo check for wcmmode
        window.parent.addEventListener("eaem-spa-component-refresh-event", (event => {
            if( !event.detail || (event.detail.type !== this.props.cqType)){
                return;
            }

            Object.assign(this.props, event.detail.data);

            this.forceUpdate();
        }).bind(this));
    }

    get imageHTML() {
        const imgStyles = {
            "display": 'block',
            "margin-left": 'auto',
            "margin-right": 'auto'
        };

        return (
            <div>
                <Link to={this.props.imageLink}>
                    <img src={this.props.fileReference} style={imgStyles}/>
                </Link>
            </div>
        );
    }

    render() {
        return this.imageHTML;
    }
}

export default MapTo('eaem-cs-spa-ssr-form/components/image')(Image,ImageEditConfig);
