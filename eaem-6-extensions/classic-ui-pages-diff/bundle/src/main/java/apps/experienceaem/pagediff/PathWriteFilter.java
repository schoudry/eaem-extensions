package apps.experienceaem.pagediff;

import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;

import javax.servlet.*;
import java.io.IOException;
import java.io.PrintWriter;

@Component(
        label = "Path Write Filter",
        description = "Experience AEM Path Write Filter",
        metatype = true)
@Service(Filter.class)
@Properties({
        @Property(name = "filter.scope", value = "component", propertyPrivate = true),
        @Property(name = "filter.order", intValue = 1001, propertyPrivate = true)
})
public class PathWriteFilter implements Filter {
    private static String EAEM_OUTPUT_PATH = "eaemOutputPath";

    public void init(FilterConfig filterConfig) throws ServletException {
    }

    public void destroy() {
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest req = (SlingHttpServletRequest) request;
        SlingHttpServletResponse resp = (SlingHttpServletResponse) response;

        Boolean outputPaths = "true".equalsIgnoreCase(req.getParameter(EAEM_OUTPUT_PATH));

        Resource resource = req.getResource();
        PrintWriter out = resp.getWriter();

        if (outputPaths) {
            out.print("<div data-eaem-path='" + resource.getPath() + "'>");
        }

        chain.doFilter(req, resp);

        if (outputPaths) {
            out.print("</div>");
        }
    }
}