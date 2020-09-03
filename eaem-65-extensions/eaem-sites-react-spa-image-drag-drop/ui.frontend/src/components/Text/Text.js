import { MapTo } from '@adobe/cq-react-editable-components';
import DOMPurify from 'dompurify';
import React, { Component } from 'react';

/**
 * Default Edit configuration for the Text component that interact with the Core Text component and sub-types
 *
 * @type EditConfig
 */
const TextEditConfig = {
    emptyLabel: 'Text - Experience AEM',

    isEmpty: function (props) {
        return !props || !props.text || props.text.trim().length < 1;
    }
};

/**
 * Text React component
 */
class Text extends Component {
    get richTextContent() {
        return (
            <div>
                <div
                    id={extractModelId(this.props.cqPath)}
                    data-rte-editelement
                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(this.props.text) }}
                />
            </div>
        );
    }

    get textContent() {
        return <div>{this.props.text}</div>;
    }

    render() {
        return this.props.richText ? this.richTextContent : this.textContent;
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/text')(
    Text,
    TextEditConfig
);

function extractModelId(path) {
    return path && path.replace(/\/|:/g, '_');
}
