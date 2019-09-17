package apps.experienceaem.assets;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;

import javax.servlet.*;
import java.io.IOException;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM Datasource Sort Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=^(/mnt/overlay/dam/gui/content/processingprofilepage/selectfolderwizard/destination).*$"
        }
)
public class EAEMSortFolders implements Filter {
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
            if(!EAEMSortFolders.SORT_NAME.equals(paramName)){
                return super.getParameter(paramName);
            }

            return EAEMSortFolders.SORT_NAME_NAME;
        }
    }
}
