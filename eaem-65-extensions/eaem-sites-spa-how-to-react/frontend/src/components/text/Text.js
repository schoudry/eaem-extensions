import React, {Component} from 'react';
import {MapTo} from '@adobe/cq-react-editable-components';
import extractModelId from '../../utils/extract-model-id';
import "./Text.css";

const TextEditConfig = {
    emptyLabel: 'Text - EAEM SPA',

    isEmpty: function (props) {
        return !props || !props.text || props.text.trim().length < 1;
    }
};

class Text extends Component {
    get richTextContent() {
        return <div id={extractModelId(this.props.cqPath)}
                    className="textbox" data-rte-editelement
                    dangerouslySetInnerHTML={{__html:  this.props.text}}/>;
    }

    get textContent() {
        return <div className="textbox">
            {this.props.text}
        </div>;
    }

    render() {
        return this.props.richText ? this.richTextContent : this.textContent;
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/text')(Text, TextEditConfig);
