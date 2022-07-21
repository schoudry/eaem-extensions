package apps.experienceaem.sites.core;

import com.adobe.granite.ui.components.ds.DataSource;
import com.adobe.granite.ui.components.ds.SimpleDataSource;
import com.adobe.granite.ui.components.ds.ValueMapResource;
import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.iterators.TransformIterator;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceMetadata;
import org.apache.sling.api.resource.ResourceResolver;
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

    public static String EAEM_COLUMNS = "/apps/wcm/core/content/common/availablecolumns";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
        SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;
        ResourceResolver resolver = slingRequest.getResourceResolver();

        chain.doFilter(slingRequest, slingResponse);

        DataSource ds = (DataSource)request.getAttribute(DataSource.class.getName());

        Resource eaemColumnsRes = resolver.getResource(EAEM_COLUMNS);

        if( (ds == null) || (eaemColumnsRes == null)){
            return;
        }

        final List<ValueMap> dsList = new ArrayList<ValueMap>();
        Iterator items = ds.iterator();

        while (items.hasNext()) {
            dsList.add(((ValueMapResource)items.next()).getValueMap());
        }

        Iterator<Resource> resourceItr = eaemColumnsRes.listChildren();

        while(resourceItr.hasNext()){
            Resource columnRes = resourceItr.next();
            ValueMap columnVM = columnRes.getValueMap();

            dsList.add(getCustomColumnVM(columnRes.getName(), columnVM.get("jcr:title", String.class),
                            columnVM.get("columnGroup", String.class)));
        }

        ds = new SimpleDataSource(new TransformIterator(dsList.iterator(), new Transformer() {
            public Object transform(Object o) {
                ValueMap vm = (ValueMap) o;

                return new ValueMapResource(slingRequest.getResourceResolver(), new ResourceMetadata(), "nt:unstructured", vm);
            }
        }));

        request.setAttribute(DataSource.class.getName(), ds);
    }

    private ValueMap getCustomColumnVM(String value, String text, String columnGroup){
        ValueMap vm = new ValueMapDecorator(new HashMap<String, Object>());

        vm.put("value", value);
        vm.put("default", false);
        vm.put("text", text);
        vm.put("show-selector", "");
        vm.put("columnGroup", columnGroup);
        vm.put("description-icon", "");

        return vm;
    }

    @Override
    public void destroy() {
    }
}
