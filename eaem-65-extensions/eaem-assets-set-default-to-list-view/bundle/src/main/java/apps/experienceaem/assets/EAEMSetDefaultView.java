package apps.experienceaem.assets;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;

import javax.servlet.*;
import javax.servlet.http.Cookie;
import java.io.IOException;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM Login page Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.resourceTypes=granite/core/components/login"
        }
)
public class EAEMSetDefaultView implements Filter {
    private static String ASSETS_VIEW_COOKIE = "cq-assets-files";

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;
        SlingHttpServletResponse slingResponse = (SlingHttpServletResponse)response;

        Cookie cookie = slingRequest.getCookie(ASSETS_VIEW_COOKIE);

        if ( (cookie == null) || StringUtils.isEmpty(cookie.getValue())) {
            cookie = new Cookie(ASSETS_VIEW_COOKIE, "list");
            cookie.setPath("/");
            slingResponse.addCookie(cookie);
        }

        chain.doFilter(slingRequest, response);
    }

    public void init(FilterConfig filterConfig) throws ServletException {
    }

    public void destroy() {
    }
}
