package apps.experienceaem.sites.core.servlets;

import apps.experienceaem.sites.core.services.FireflyService;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(
    name = "Experience AEM Generate Firefly Image Servlet",
    immediate = true,
    service = Servlet.class,
    property = {
        "sling.servlet.methods=GET",
        "sling.servlet.paths=/bin/eaem/firefly/generate"
    }
)
public class GenerateFireFlyImageServlet extends SlingAllMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(GenerateFireFlyImageServlet.class);

    @Reference
    transient FireflyService ffService;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {

        try{
            String text = request.getParameter("text");

            if(StringUtils.isEmpty(text) ){
                response.getWriter().println("'text' parameter missing in request");
                return;
            }

            String base64Image = ffService.generateImage(text);

            response.getWriter().print(base64Image);
        }catch(Exception e){
            throw new ServletException("Error", e);
        }
    }
}
