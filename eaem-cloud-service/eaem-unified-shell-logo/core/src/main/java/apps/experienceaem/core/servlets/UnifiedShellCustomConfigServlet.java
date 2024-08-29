package apps.experienceaem.core.servlets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
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
        "sling.servlet.paths=/bin/eaem/usconfig"
    }
)
@Designate(ocd = UnifiedShellCustomConfigServlet.USConfiguration.class)
public class UnifiedShellCustomConfigServlet extends SlingAllMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(UnifiedShellCustomConfigServlet.class);

    private String usConfigJson = "{}";

    @Activate
    @Modified
    protected void activate(final USConfiguration config) {
        usConfigJson = config.usConfigJson();
    }

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {

        try{
            response.setContentType("application/json");
            response.getWriter().println(usConfigJson);
        }catch(Exception e){
            throw new ServletException("Error getting unified shell config json", e);
        }
    }

    @ObjectClassDefinition(name = "Experience AEM Unified Shell Custom Configuration")
    public @interface USConfiguration {
        @AttributeDefinition(
            name = "Config Json",
            description = "Json Configuration of logo, env etc",
            type = AttributeType.STRING
        )
        String usConfigJson() default "{}";
    }
}
