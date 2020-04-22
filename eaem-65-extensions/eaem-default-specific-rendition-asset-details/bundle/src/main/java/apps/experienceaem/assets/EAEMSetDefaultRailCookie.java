package apps.experienceaem.assets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;

import javax.servlet.*;
import javax.servlet.http.Cookie;
import java.io.IOException;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM Default Rail Cookie Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT"
        }
)
public class EAEMSetDefaultRailCookie implements Filter {
    public static String RAIL_CQ_PROPERTIES_PAGE = "rail-cq-propertiespage";

    public static String RENDITIONS = "renditions";

    public void init(FilterConfig filterConfig) throws ServletException {
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;

        String requestURI = slingRequest.getRequestURI();

        if (!requestURI.startsWith("/assetdetails.html")) {
            chain.doFilter(request, response);
            return;
        }

        SlingHttpServletRequest defaultRailCookie = new EAEMDefaultRailServletRequestWrapper(slingRequest);
        chain.doFilter(defaultRailCookie, response);
    }

    public void destroy() {
    }

    private class EAEMDefaultRailServletRequestWrapper extends SlingHttpServletRequestWrapper {
        public EAEMDefaultRailServletRequestWrapper(final SlingHttpServletRequest request) {
            super(request);
        }

        @Override
        public Cookie getCookie(String cookieName) {
            if (!EAEMSetDefaultRailCookie.RAIL_CQ_PROPERTIES_PAGE.equals(cookieName)) {
                return super.getCookie(cookieName);
            }

            Cookie cookie = new Cookie(EAEMSetDefaultRailCookie.RAIL_CQ_PROPERTIES_PAGE, EAEMSetDefaultRailCookie.RENDITIONS);
            cookie.setPath("/");

            return cookie;
        }
    }

}
