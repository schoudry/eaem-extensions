package apps.experienceaem.sites;

import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.SlingHttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;

@Component(
        metatype = true,
        description = "Experience AEM Request filter for ContentResourcesDataSourceServlet",
        label = "EAEM Datasource Sort Filter")
@Service({Filter.class})
@Properties({
        @Property(name = "sling.filter.scope",value = {"REQUEST"},propertyPrivate = true),
        @Property(
                name = "sling.servlet.resourceTypes",
                value = {"cq/gui/components/common/wcm/datasources/childpages",
                        "cq/gui/components/common/wcm/datasources/contentresources"},
                propertyPrivate = true),
        @Property(name = "service.ranking",intValue = {-99},propertyPrivate = true)})
public class EAEMPagesDatasourceFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(EAEMPagesDatasourceFilter.class);

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        //solved using a different method; left this class for some boilerplate code

        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;

        chain.doFilter(slingRequest, response);
    }

    @Override
    public void destroy() {
    }
}
