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
import withAsyncImport from "../utils/withAsyncImport";

import './Page/Page';
import './Container/Container';
import './Nav/Nav';

import {MapTo} from '@adobe/aem-react-editable-components';

//lazyload / code splitting example of an internal component
const LazyTextComponent = withAsyncImport(() => import(`./Text/Text`));

//lazy load of internal component (hello world)

/**
 * Default Edit configuration for the Text component that interact with the Core Text component and sub-types
 *
 * @type EditConfig
 */
const TextEditConfig = {
    emptyLabel: 'Text',

    isEmpty: function (props) {
        return !props || !props.text || props.text.trim().length < 1;
    }
};

MapTo('eaem-spa-short-urls/components/text')(LazyTextComponent, TextEditConfig);