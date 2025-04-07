package apps.experienceaem.sites.core.servlets;

import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.http.whiteboard.HttpWhiteboardConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;

import java.io.IOException;

import static org.osgi.service.http.whiteboard.HttpWhiteboardConstants.HTTP_WHITEBOARD_FILTER_SERVLET;

@Component(
    service = Filter.class,
    immediate = true,
    property = {
        Constants.SERVICE_RANKING + ":Integer=-99",
        HTTP_WHITEBOARD_FILTER_SERVLET + "=" + "com.adobe.aem.repoapi.RepoApiServlet",
        HttpWhiteboardConstants.HTTP_WHITEBOARD_CONTEXT_SELECT + "=("
            + HttpWhiteboardConstants.HTTP_WHITEBOARD_CONTEXT_PATH + "=" + "/adobe)"
    }
)
public class RestrictExperienceUI implements Filter {
    private static final Logger log = LoggerFactory.getLogger(RestrictExperienceUI.class);

    private static final String ADOBE_REPO = "/adobe";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
        /*HttpServletRequest httpRequest = (HttpServletRequest) request;

        String requestURI = httpRequest.getRequestURI();

        if(requestURI.startsWith(ADOBE_REPO)){
            throw new ServletException("Experience UI Unsupported");
        }*/

        chain.doFilter(request, response);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void destroy() {
    }
}
