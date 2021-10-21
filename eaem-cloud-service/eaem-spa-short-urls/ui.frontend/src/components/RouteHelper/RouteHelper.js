import React, {Component} from 'react';
import {Route} from 'react-router-dom';
import {AuthoringUtils} from "@adobe/aem-spa-page-model-manager";
import {PROJECT_URL_ROOT} from "../appConstants";

export const withRoute = (WrappedComponent, extension) => {
    return class CompositeRoute extends Component {
        render() {
            let routePath = this.props.cqPath;
            if (!routePath) {
                return <WrappedComponent {...this.props} />;
            }

            extension = extension || 'html';

            let paths = ['(.*)' + routePath + '(.' + extension + ')?'];

            if (!AuthoringUtils.isInEditor() && routePath.startsWith(PROJECT_URL_ROOT)) {
                paths.push(routePath.substring(PROJECT_URL_ROOT.length));
            }

            console.log(paths);

            // Context path + route path + extension
            return (
                <Route
                    key={routePath}
                    exact
                    path={ paths }
                    render={routeProps => {
                        return <WrappedComponent {...this.props} {...routeProps} />;
                    }}
                />
            );
        }
    };
};
