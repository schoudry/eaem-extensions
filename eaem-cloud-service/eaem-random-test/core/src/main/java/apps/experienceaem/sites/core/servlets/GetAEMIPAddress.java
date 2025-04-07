package apps.experienceaem.sites.core.servlets;

import org.apache.http.client.fluent.Request;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(
    immediate = true,
    service = Servlet.class,
    property = {
        "sling.servlet.methods=GET",
        "sling.servlet.paths=/bin/experience-aem/aem-ip"
    }
)
public class GetAEMIPAddress extends SlingSafeMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(GetAEMIPAddress.class);

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {
        try{
            response.getWriter().println("cs dev----" + getAEMIPAddress());
        }catch(Exception e){
            throw new ServletException("Error getting IP", e);
        }
    }

    private String getAEMIPAddress() throws Exception {
        return Request.Get("https://ifconfig.me/ip").execute().returnContent().asString();
    }
}
