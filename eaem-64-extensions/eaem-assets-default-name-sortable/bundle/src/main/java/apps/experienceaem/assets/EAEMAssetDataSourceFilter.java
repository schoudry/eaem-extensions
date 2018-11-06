package apps.experienceaem.assets;

import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;

@Component(
        metatype = true,
        description = "Experience AEM Request filter for AssetsDataSourceServlet",
        label = "EAEM Datasource Sort Filter")
@Service({Filter.class})
@Properties({
        @Property(name = "sling.filter.scope",value = {"REQUEST"},propertyPrivate = true),
        @Property(  name = "sling.filter.pattern",
                    value = {"/mnt/overlay/dam/gui/content/assets/jcr:content/views/.*"},
                    propertyPrivate = true),
        @Property(name = "service.ranking",intValue = {-99},propertyPrivate = true
)})
public class EAEMAssetDataSourceFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(EAEMAssetDataSourceFilter.class);

    public static String SORT_NAME = "sortName";

    public static String SORT_NAME_NAME = "name";


    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;

        String orderBy = slingRequest.getParameter(SORT_NAME);

        if(StringUtils.isNotEmpty(orderBy)){
            chain.doFilter(request, response);
            return;
        }

        SlingHttpServletRequest nameSortRequest = new NameSortSlingServletRequestWrapper(slingRequest);
        chain.doFilter(nameSortRequest, response);
    }

    @Override
    public void destroy() {
    }

    private class NameSortSlingServletRequestWrapper extends SlingHttpServletRequestWrapper {
        public NameSortSlingServletRequestWrapper(final SlingHttpServletRequest request) {
            super(request);
        }

        @Override
        public String getParameter(String paramName) {
            if(!EAEMAssetDataSourceFilter.SORT_NAME.equals(paramName)){
                return super.getParameter(paramName);
            }

            return EAEMAssetDataSourceFilter.SORT_NAME_NAME;
        }
    }
}
