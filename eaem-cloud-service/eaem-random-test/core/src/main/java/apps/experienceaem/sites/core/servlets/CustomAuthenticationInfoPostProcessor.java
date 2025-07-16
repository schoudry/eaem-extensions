package apps.experienceaem.sites.core.servlets;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.auth.core.spi.AuthenticationInfo;
import org.apache.sling.auth.core.spi.AuthenticationInfoPostProcessor;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component(service = AuthenticationInfoPostProcessor.class, immediate = true)
public class CustomAuthenticationInfoPostProcessor implements AuthenticationInfoPostProcessor {
    private static final Logger LOG = LoggerFactory.getLogger(CustomAuthenticationInfoPostProcessor.class);

    private boolean enabled;

    @Activate
    @Modified
    protected void activate(final CustomAuthenticationPostProcessorConfig config) {
        LOG.info("[activate] - Activating CustomAuthenticationInfoPostProcessor");
        enabled = config.is_enabled();
    }

    @Override
    public void postProcess(final AuthenticationInfo authenticationInfo,
                            final HttpServletRequest httpServletRequest,
                            final HttpServletResponse httpServletResponse) throws LoginException {

        LOG.info("CustomAuthenticationInfoPostProcessor - postProcess()");

        String result = "";

        try{
            String base64SamlRespponse = httpServletRequest.getParameter("SAMLResponse");

            if(StringUtils.isAllBlank(base64SamlRespponse)){
                LOG.info("CustomAuthenticationInfoPostProcessor - postProcess() empty SAMLResponse");
                return;
            }

            InputStream inputStream = new ByteArrayInputStream(Base64.getDecoder().decode(base64SamlRespponse));

            result = IOUtils.toString(inputStream, StandardCharsets.UTF_8);
        }catch (Exception e){
            LOG.error("Error reading saml response", e);
        }

        LOG.info("CustomAuthenticationInfoPostProcessor - SAMLResponse : " + result);
    }

    @ObjectClassDefinition(name = "Custom Authentication Post Processor Configuration",
            description = "Configuration details for the Custom Authentication Post Processor Service")
    public @interface CustomAuthenticationPostProcessorConfig {
        @AttributeDefinition(name = "Enabled",
                description = "Indicates if the processor should be enabled",
                type = AttributeType.BOOLEAN)
        boolean is_enabled() default true;
    }
}
