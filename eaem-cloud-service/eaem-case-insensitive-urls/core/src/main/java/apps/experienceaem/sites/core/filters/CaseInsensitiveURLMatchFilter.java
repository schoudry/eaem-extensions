package apps.experienceaem.sites.core.filters;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.NonExistingResource;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM Case Insensitive URL Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=(/content/eaem-case-insensitive-urls/.*.html)",
        }
)
public class CaseInsensitiveURLMatchFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(CaseInsensitiveURLMatchFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
        SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;

        try {
            String uri = slingRequest.getRequestURI();

            if(!uri.endsWith(".html")){
                chain.doFilter(request, response);
                return;
            }

            Resource resource = slingRequest.getResource();

            if( (resource != null) && !(resource instanceof NonExistingResource)){
                chain.doFilter(request, response);
                return;
            }

            ResourceResolver resolver = slingRequest.getResourceResolver();

            String resPath = uri.substring(0,uri.lastIndexOf(".html"));
            resPath = resPath.toLowerCase();

            resource = resolver.getResource(resPath);

            if(resource != null){
                RequestDispatcher dp = slingRequest.getRequestDispatcher(resPath + ".html");
                dp.include(slingRequest, slingResponse);
                return;
            }

            chain.doFilter(request, response);
        } catch (Exception e) {
            log.error("Error finding resource : " + slingRequest.getRequestURI());
            slingResponse.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void destroy() {
    }
}
