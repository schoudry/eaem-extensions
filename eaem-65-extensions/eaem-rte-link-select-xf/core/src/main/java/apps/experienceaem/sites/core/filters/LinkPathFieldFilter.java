package apps.experienceaem.sites.core.filters;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.servlet.*;
import java.io.IOException;
import java.util.Map;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM Link path field Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=REQUEST",
                "sling.filter.pattern=/mnt/overlay/cq/gui/content/linkpathfield/picker/*.*",
        }
)
public class LinkPathFieldFilter implements Filter {
    private static Logger logger = LoggerFactory.getLogger(LinkPathFieldFilter.class);

    public static String EXCLUDE = "exclude";
    public static String EXCLUDE_NONE = "none";
    public static String LINK_PATH_DS = "/libs/cq/gui/content/linkpathfield/picker/views/column/datasource";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;

        try{
            Resource linkPathDSRes = slingRequest.getResourceResolver().getResource(LINK_PATH_DS);
            linkPathDSRes.adaptTo(Node.class).setProperty(EXCLUDE, EXCLUDE_NONE);//set property for this request, not saved to CRX
        }catch(Exception e){
            logger.error("Error overriding property 'exclude'", e);
        }

        chain.doFilter(slingRequest, response);
    }

    public void init(FilterConfig filterConfig) throws ServletException {
    }

    public void destroy() {
    }
}