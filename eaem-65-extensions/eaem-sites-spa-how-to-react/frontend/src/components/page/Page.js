import { Page, MapTo, withComponentMappingContext } from "@adobe/cq-react-editable-components";
import {withRoute} from "./../routing/RouteHelper";
require('./Page.css');

// This component is a variant of a Page component mapped to the "eaem-sites-spa-how-to-react/components/page" resource type.
class EAEMSPAPage extends Page {
    get containerProps() {
        let attrs = super.containerProps;
        attrs.className = (attrs.className || '') + ' page ' + (this.props.cssClassNames || '');
        return attrs;
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/page')(
    withComponentMappingContext(withRoute(EAEMSPAPage))
);
