import { Page, withModel } from '@adobe/aem-react-editable-components';
import React from 'react';

// This component is the application entry point
class App extends Page {
    render() {
        const vanityUrls = this.props.vanityUrls;

        return (
            <div>
                {this.childComponents}
                {this.childPages.map((childPage) => {
                    {
                        childPage.props.vanityUrls = vanityUrls;
                        return <React.Fragment>
                            {childPage}
                        </React.Fragment>
                    }
                })}
            </div>
        );
    }
}

export default withModel(App);
