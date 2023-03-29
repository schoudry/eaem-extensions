package apps.eaem.platform.core.servlets;

import com.adobe.granite.ui.components.ds.DataSource;
import com.adobe.granite.ui.components.ds.SimpleDataSource;
import org.apache.commons.collections4.iterators.TransformIterator;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceWrapper;
import com.adobe.granite.ui.components.Config;
import org.apache.sling.api.resource.ValueMap;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.commons.collections4.Transformer;

import javax.servlet.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

@Component(
    service = Filter.class,
    immediate = true,
    property = {
        Constants.SERVICE_RANKING + ":Integer=-99",
        "sling.filter.scope=COMPONENT",
        "sling.filter.resourceTypes=granite/ui/components/shell/globalnav/datasources/navitems"
    }
)
public class NavItemsDataSourceFilter implements Filter {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private static final String NAV_ASSETS_PATH = "/mnt/overlay/cq/core/content/nav/assets";

    private static final List EXCLUDE_ITEMS = Arrays.asList(new String[]{"/mnt/overlay/cq/core/content/nav/assets/asyncjobs"});

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
        SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;

        try {
            if (!slingRequest.getPathInfo().endsWith(NAV_ASSETS_PATH)) {
                chain.doFilter(slingRequest, slingResponse);
                return;
            }

            Resource slingRequestResource = slingRequest.getResource();
            Resource repConfigRes = slingRequestResource.getChild(Config.DATASOURCE);

            if (repConfigRes == null) {
                chain.doFilter(slingRequest, slingResponse);
                return;
            }

            chain.doFilter(slingRequest, slingResponse);

            ValueMap repConfigVM = repConfigRes.getValueMap();
            final String itemRT = repConfigVM.get("itemResourceType", "");

            SimpleDataSource ds = (SimpleDataSource) request.getAttribute(DataSource.class.getName());

            if (ds == null) {
                chain.doFilter(slingRequest, slingResponse);
                return;
            }

            final List<Resource> dsList = new ArrayList<Resource>();
            Iterator<Resource> items = ds.iterator();
            Resource resource = null;

            while (items.hasNext()) {
                resource = (Resource) items.next();

                if (EXCLUDE_ITEMS.contains(resource.getPath())) {
                    continue;
                }

                dsList.add(resource);
            }

            ds = new SimpleDataSource(new TransformIterator(dsList.iterator(), new Transformer<Resource, Resource>() {
                public Resource transform(Resource r) {
                    return new ResourceWrapper(r) {
                        public String getResourceType() {
                            return r.getValueMap().get("itemResourceType", itemRT);
                        }

                        public Iterable<Resource> getChildren() {
                            return new ArrayList<Resource>();
                        }
                    };
                }
            }));

            request.setAttribute(DataSource.class.getName(), ds);
        } catch (Exception e) {
            logger.error("Error working with nav items list", e);
        }

    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }


    @Override
    public void destroy() {
    }

}
