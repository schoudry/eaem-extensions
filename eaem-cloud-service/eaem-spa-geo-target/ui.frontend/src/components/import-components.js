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
import './ExperienceFragment/ExperienceFragment';
import './Nav/Nav';
import './geo-xf/geo-xf';

import {MapTo} from '@adobe/aem-react-editable-components';

const LazyTextComponent = withAsyncImport(() => import(`./Text/Text`));

const TextEditConfig = {
    emptyLabel: 'Text',

    isEmpty: function (props) {
        return !props || !props.text || props.text.trim().length < 1;
    }
};

MapTo('eaem-spa-geo-target/components/text')(LazyTextComponent, TextEditConfig);