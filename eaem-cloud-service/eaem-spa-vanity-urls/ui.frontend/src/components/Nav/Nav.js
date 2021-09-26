import React, {Component} from 'react';
import {MapTo} from '@adobe/aem-react-editable-components';
import {Link} from "react-router-dom";
import { NavLink } from "react-router-dom";
import {BrowserRouter} from 'react-router-dom';
import {Route} from 'react-router-dom';

import "./Nav.css";
 
const NavEditConfig = {
    emptyLabel: 'Navigation - Experience AEM',
 
    isEmpty: function(props) {
        return !props || !props.items || props.items.length < 1;
    }
};

class NavItem extends Component {
    render() {
        if(!this.props.path || !this.props.title || !this.props.url) {
            return null;
        }
        return (
            <li className="NavItem" key={this.props.path}>
                <Link className="NavItem-link" to={this.props.url}>
                        {this.props.title}
                </Link>
            </li>
        );
    }
}

export default class Nav extends Component {
    render() {
        return (
                <div className="Nav">
                    <ul className="Nav-wrapper">
                        { this.props.items && this.props.items.map((navItem, index) => {
                            return <NavItem path={navItem.path} url={navItem.url} 
                                             title={navItem.title} />
                            })
                       }
                    </ul>
                </div>
        );
    }
}
MapTo("eaem-spa-vanity-urls/components/navigation")(Nav, NavEditConfig);