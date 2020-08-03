package apps.experienceaem.assets;

import org.apache.sling.auth.core.spi.AuthenticationHandler;
import org.apache.sling.auth.core.spi.AuthenticationInfo;
import org.apache.sling.jcr.api.SlingRepository;
import org.apache.sling.auth.core.spi.AuthenticationFeedbackHandler;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.jcr.SimpleCredentials;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;

import static org.osgi.framework.Constants.SERVICE_RANKING;

@Component(
        service = { AuthenticationHandler.class },
        immediate = true,
        property = {
                SERVICE_RANKING + ":Integer=" + 9999,
                AuthenticationHandler.PATH_PROPERTY + "=/libs/granite/core/content/login.html/j_security_check",
                AuthenticationHandler.TYPE_PROPERTY + "=" + "EAEM_RECORD_CREDS",
                "service.description=Experience AEM Log j_security_check User Password Credentials"
        })
public class EAEMRecordUserPassAuthHandler implements AuthenticationHandler, AuthenticationFeedbackHandler {

    private static final Logger log = LoggerFactory.getLogger(EAEMRecordUserPassAuthHandler.class);

    private static final String REQUEST_METHOD = "POST";
    private static final String REQUEST_URL_SUFFIX = "/j_security_check";

    @Reference
    private SlingRepository repository;

    @Reference(target = "(service.pid=com.day.crx.security.token.impl.impl.TokenAuthenticationHandler)")
    private AuthenticationHandler wrappedAuthHandler;

    public AuthenticationInfo extractCredentials(HttpServletRequest request, HttpServletResponse response) {
        if (REQUEST_METHOD.equals(request.getMethod()) && request.getRequestURI().endsWith(REQUEST_URL_SUFFIX)) {
            AuthenticationInfo authInfo = wrappedAuthHandler.extractCredentials(request, response);

            SimpleCredentials sc = (SimpleCredentials) authInfo.get("user.jcr.credentials");

            log.debug("User: " + sc.getUserID() + ", Password : " + new String(sc.getPassword()));

            return authInfo;
        }

        return null;
    }

    public boolean requestCredentials(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws IOException {
        return wrappedAuthHandler.requestCredentials(httpServletRequest, httpServletResponse);
    }

    public void dropCredentials(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws IOException {
        wrappedAuthHandler.dropCredentials(httpServletRequest, httpServletResponse);
    }

    @Override
    public void authenticationFailed(HttpServletRequest request, HttpServletResponse response, AuthenticationInfo authInfo) {
        if (wrappedAuthHandler instanceof AuthenticationFeedbackHandler) {
            ((AuthenticationFeedbackHandler) wrappedAuthHandler).authenticationFailed(request, response, authInfo);
        }
    }

    @Override
    public boolean authenticationSucceeded(HttpServletRequest request, HttpServletResponse response, AuthenticationInfo authInfo) {
        if (wrappedAuthHandler instanceof AuthenticationFeedbackHandler) {
            return ((AuthenticationFeedbackHandler) wrappedAuthHandler).authenticationSucceeded(request, response, authInfo);
        }
        return false;
    }
}