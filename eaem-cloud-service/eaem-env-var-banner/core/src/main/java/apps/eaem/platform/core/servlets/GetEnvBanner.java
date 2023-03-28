package apps.eaem.platform.core.servlets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.json.JSONWriter;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
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
                "sling.servlet.paths=/bin/eaem/env-banner"
        }
)
@Designate(ocd=GetEnvBanner.Configuration.class)
public class GetEnvBanner extends SlingSafeMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(GetEnvBanner.class);

    private String bannerText = "";

    @Activate
    protected void activate(GetEnvBanner.Configuration configuration) {
        this.bannerText = configuration.bannerText();
    }

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        try {
            response.setContentType("application/json");
            response.setCharacterEncoding("utf-8");

            JSONWriter jw = new JSONWriter(response.getWriter());
            jw.object();
            jw.key("bannerText").value(bannerText);
            jw.endObject();
        } catch (Exception e) {
            throw new ServletException("Error", e);
        }
    }

    @ObjectClassDefinition(
            name = "Experience AEM - Banner Text"
    )
    @interface Configuration {
        @AttributeDefinition(
                name = "Banner Text",
                description = "Banner Text appearing in unified shell green label",
                type = AttributeType.STRING
        )
        String bannerText() default "";
    }
}
