package apps.experienceaem.sites.spa.core.filters;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM convert SPA home requests from POST to GET ",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=(/content/eaem-cs-spa-read-post-data/us/en/home*)",
        }
)
public class OnBoardingPostModifierFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(OnBoardingPostModifierFilter.class);

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
        SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;

        try {
            if(!slingRequest.getMethod().equals("POST")){
                chain.doFilter(request, response);
                return;
            }

            slingResponse.setHeader("Dispatcher", "no-cache");

            RequestDispatcher dp = request.getRequestDispatcher(slingRequest.getRequestPathInfo().getResourcePath() + ".html");

            dp.include(new GetSlingServletRequestWrapper(slingRequest), response);
        } catch (Exception e) {
            log.error("Error converting POST to GET of SPA home : " + slingRequest.getRequestURI());
        }
    }

    @Override
    public void destroy() {
    }

    private class GetSlingServletRequestWrapper extends SlingHttpServletRequestWrapper {
        public GetSlingServletRequestWrapper(final SlingHttpServletRequest request) {
            super(request);
        }

        public String getMethod() {
            return "GET";
        }
    }
}
