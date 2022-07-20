package apps.experienceaem.sites.core.filters;

import com.adobe.granite.ui.components.ds.DataSource;
import com.adobe.granite.ui.components.ds.SimpleDataSource;
import com.adobe.granite.ui.components.ds.ValueMapResource;
import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.iterators.TransformIterator;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceMetadata;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.wrappers.ValueMapDecorator;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM - Sites CSV Export Custom Data Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.resourceTypes=cq/gui/components/siteadmin/admin/listview/columns/datasources/availablecolumnsdatasource"
        }
)
public class AvailableColumnsDSFilter implements Filter {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    public static String EAEM_COLUMN_GROUP = "Experience AEM";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
        SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;

        chain.doFilter(slingRequest, slingResponse);

        DataSource ds = (DataSource)request.getAttribute(DataSource.class.getName());

        final List<ValueMap> dsList = new ArrayList<ValueMap>();
        Iterator items = ds.iterator();

        while (items.hasNext()) {
            dsList.add(((ValueMapResource)items.next()).getValueMap());
        }

        dsList.add(getCustomColumnVM("eaemTitle", "EAEM Title"));

        ds = new SimpleDataSource(new TransformIterator(dsList.iterator(), new Transformer() {
            public Object transform(Object o) {
                ValueMap vm = (ValueMap) o;

                return new ValueMapResource(slingRequest.getResourceResolver(), new ResourceMetadata(), "nt:unstructured", vm);
            }
        }));

        request.setAttribute(DataSource.class.getName(), ds);
    }

    private ValueMap getCustomColumnVM(String value, String text){
        ValueMap vm = new ValueMapDecorator(new HashMap<String, Object>());

        vm.put("value", value);
        vm.put("default", false);
        vm.put("text", text);
        vm.put("show-selector", "");
        vm.put("columnGroup", EAEM_COLUMN_GROUP);
        vm.put("description-icon", "");

        return vm;
    }

    @Override
    public void destroy() {
    }
}
