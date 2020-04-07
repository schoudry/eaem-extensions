package apps.experienceaem.assets;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.auth.core.spi.AuthenticationHandler;
import org.apache.sling.auth.core.spi.AuthenticationInfo;
import org.apache.sling.jcr.api.SlingRepository;
import org.apache.sling.jcr.resource.api.JcrResourceConstants;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.jcr.SimpleCredentials;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import static org.osgi.framework.Constants.SERVICE_RANKING;

@Component(
        service = { AuthenticationHandler.class, Filter.class },
        immediate = true,
        property = {
            SERVICE_RANKING + ":Integer=" + 9999,
            AuthenticationHandler.PATH_PROPERTY + "=/content/dam",
            AuthenticationHandler.PATH_PROPERTY + "=/conf",
            "service.description=Experience AEM Ready only Authentication Handler",
            "sling.filter.scope=REQUEST"
        })
@Designate(ocd = EAEMReadonlyAuthenticationHandler.Configuration.class)
public class EAEMReadonlyAuthenticationHandler implements AuthenticationHandler, Filter  {
    private static final Logger log = LoggerFactory.getLogger(EAEMReadonlyAuthenticationHandler.class);

    private static String AUTH_TYPE_ASSET_SELECTOR = "EAEM_ASSET_SELECTOR";

    private static final String SESSION_REQ_ATTR = EAEMReadonlyAuthenticationHandler.class.getName() + ".session";

    private String readOnlyUser = "";

    @Reference
    private SlingRepository repository;

    @Reference(target = "(service.pid=com.day.crx.security.token.impl.impl.TokenAuthenticationHandler)")
    private AuthenticationHandler wrappedAuthHandler;

    @Activate
    protected void activate(final Configuration config) {
        readOnlyUser = config.read_only_user();
    }

    public AuthenticationInfo extractCredentials(HttpServletRequest request, HttpServletResponse response) {
        AuthenticationInfo authInfo = null;

        String authType = request.getParameter("authType");

        if(StringUtils.isEmpty(authType) || !authType.equals(AUTH_TYPE_ASSET_SELECTOR)){
            return wrappedAuthHandler.extractCredentials(request, response);
        }

        Session adminSession = null;

        try{
            adminSession = repository.loginAdministrative(null);

            Session userSession = adminSession.impersonate(new SimpleCredentials(readOnlyUser, new char[0]));

            request.setAttribute(SESSION_REQ_ATTR, userSession);

            authInfo = new AuthenticationInfo(AUTH_TYPE_ASSET_SELECTOR);

            authInfo.put(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, userSession);
        }catch(Exception e){
            log.error("Error could not create session for authType - " + authType, e);
            return AuthenticationInfo.FAIL_AUTH;
        }finally {
            if (adminSession != null) {
                adminSession.logout();
            }
        }

        return authInfo;
    }

    public boolean requestCredentials(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws IOException {
        return wrappedAuthHandler.requestCredentials(httpServletRequest, httpServletResponse);
    }

    public void dropCredentials(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws IOException {
        wrappedAuthHandler.dropCredentials(httpServletRequest, httpServletResponse);
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                            throws IOException, ServletException {
        Session userSession = (Session) request.getAttribute(EAEMReadonlyAuthenticationHandler.SESSION_REQ_ATTR);

        if (userSession != null) {
            request.removeAttribute(EAEMReadonlyAuthenticationHandler.SESSION_REQ_ATTR);
        }

        chain.doFilter(request, response);

        if (userSession != null) {
            userSession.logout();
        }
    }

    public void init(FilterConfig filterConfig) throws ServletException {
    }

    public void destroy() {
    }

    @ObjectClassDefinition(name = "EAEMReadonlyAuthenticationHandler Configuration")
    public @interface Configuration {

        @AttributeDefinition(
                name = "Read only user",
                description = "Read only user for accessing asset metadata json",
                type = AttributeType.STRING)
        String read_only_user() default "eaem-read-only-user";
    }
}
