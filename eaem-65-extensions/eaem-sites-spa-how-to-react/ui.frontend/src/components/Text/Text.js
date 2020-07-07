/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ~ Copyright 2020 Adobe Systems Incorporated
 ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");
 ~ you may not use this file except in compliance with the License.
 ~ You may obtain a copy of the License at
 ~
 ~     http://www.apache.org/licenses/LICENSE-2.0
 ~
 ~ Unless required by applicable law or agreed to in writing, software
 ~ distributed under the License is distributed on an "AS IS" BASIS,
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ~ See the License for the specific language governing permissions and
 ~ limitations under the License.
 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

import { MapTo } from '@adobe/cq-react-editable-components';
import DOMPurify from 'dompurify';
import React, { Component } from 'react';

require('./Text.css');

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
                <h3 style={{padding: '20px 0px 40px 0px', "text-align" : "center", "color" : "green"}}>
                    THIS TEXT HARDCODED IN REACT COMPONENT
                </h3>
                <div
                    id={extractModelId(this.props.cqPath)}
                    data-rte-editelement
                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(this.props.text)
              }}
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
