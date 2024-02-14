package apps.experienceaem.assets.core.servlets;

import org.apache.commons.lang3.StringUtils;
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
    name = "Experience AEM Get Admin Console Users Servlet",
    immediate = true,
    service = Servlet.class,
    property = {
        "sling.servlet.methods=GET",
        "sling.servlet.paths=/bin/eaem/umapi/users"
    }
)
@Designate(ocd = GetAdminConsoleUsers.UMAPIConfiguration.class)
public class GetAdminConsoleUsers extends SlingAllMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(GetAdminConsoleUsers.class);

    private String clientId = "";
    private String clientSecret = "";
    private String xApiKey = "";
    private String IMS_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
    private String UMAPI_URL = "https://usermanagement.adobe.io/v2/usermanagement/users";

    @Activate
    @Modified
    protected void activate(final UMAPIConfiguration config) {
        clientId = config.clientId();
        clientSecret = config.clientSecret();
        xApiKey = config.xApiKey();
    }

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {

        try{
            LOGGER.info("---" + clientId);
        }catch(Exception e){
            throw new ServletException("Error", e);
        }
    }

    @ObjectClassDefinition(name = "User Management API Configuration")
    public @interface UMAPIConfiguration {
        @AttributeDefinition(
            name = "Client Id",
            description = "UMAPI account clientId",
            type = AttributeType.STRING
        )
        String clientId() default "";

        @AttributeDefinition(
            name = "Client Secret",
            description = "UMAPI account clientSecret",
            type = AttributeType.STRING
        )
        String clientSecret() default "";

        @AttributeDefinition(
            name = "Client Secret",
            description = "UMAPI account X-Api-Key",
            type = AttributeType.STRING
        )
        String xApiKey() default "";
    }
}
