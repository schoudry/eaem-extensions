package apps.experienceaem.assets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(
        service = Servlet.class,
        property = {
                "sling.servlet.methods=GET",
                "sling.servlet.resourceTypes=dam:Asset",
                "sling.servlet.selectors=eaems3download",
                "sling.servlet.extensions=html"
        }
)
public class EAEMS3DownloadServlet extends SlingAllMethodsServlet{
    public final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
                        throws ServletException, IOException {
        String assetPath = request.getRequestPathInfo().getResourcePath();
        response.sendRedirect(assetPath);
    }
}
