import React, {Component} from 'react';
import {MapTo} from '@adobe/aem-react-editable-components';

const StepsEditConfig = {
    emptyLabel: 'Steps - Experience AEM',

    isEmpty: function(props) {
        return !props || !props.text || props.text.trim().length < 1;
    }
};


class Steps extends Component {
    render() {
        return (this.props.type ?
            <this.props.type style={{"text-align" : "center"}}>{this.props.text}</this.props.type> :
            <h1 style={{"text-align" : "center"}}>{this.props.text}</h1>);
    }
}

export default MapTo('eaem-cs-spa-read-post-data/components/steps')(Steps, StepsEditConfig);