import React, {Component} from 'react';
import {MapTo} from '@adobe/cq-react-editable-components';

const TitleEditConfig = {
    emptyLabel: 'Title - Experience AEM',

    isEmpty: function(props) {
        return !props || !props.text || props.text.trim().length < 1;
    }
};


class Title extends Component {
    render() {
        return (this.props.type ?
            <this.props.type style={{"text-align" : "center"}}>{this.props.text}</this.props.type> :
            <h1 style={{"text-align" : "center"}}>{this.props.text}</h1>);
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/title')(Title, TitleEditConfig);