package apps.experienceaem.sites.core.servlets;

import com.adobe.granite.auth.saml.spi.Assertion;
import com.adobe.granite.auth.saml.spi.Message;
import com.adobe.granite.auth.saml.spi.SamlHook;
import com.adobe.granite.auth.saml.spi.SamlHookException;
import org.apache.sling.auth.core.spi.AuthenticationInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CustomSAMLHook implements SamlHook {
    private static final Logger LOG = LoggerFactory.getLogger(CustomSAMLHook.class);


    @Override
    public void postSyncUserProcess(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse,
                                    Assertion assertion, AuthenticationInfo authenticationInfo, String samlResponse) throws SamlHookException {
        LOG.info("EAEM - CustomSAMLHook.postSyncUserProcess() - samlResponse : " + samlResponse);
        LOG.info("EAEM - CustomSAMLHook.postSyncUserProcess() - authenticationInfo : " + authenticationInfo.getUser());
    }

    @Override
    public void postSamlValidationProcess(HttpServletRequest httpServletRequest, Assertion assertion, Message message) throws SamlHookException {
        LOG.info("EAEM - CustomSAMLHook.postSamlValidationProcess() - message : " + message);
    }
}
