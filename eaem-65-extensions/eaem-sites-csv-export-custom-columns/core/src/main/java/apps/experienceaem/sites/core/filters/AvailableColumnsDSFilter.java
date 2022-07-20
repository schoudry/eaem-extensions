package apps.experienceaem.sites.core.filters;

import com.adobe.granite.ui.components.ds.DataSource;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;

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

    public static String DATA_SOURCE_NAME = DataSource.class.getName();

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

        logger.info("----" +  ds);
    }

    @Override
    public void destroy() {
    }
}
