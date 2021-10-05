package apps.experienceaem.assets.core.services;

import static org.osgi.framework.Constants.SERVICE_RANKING;

import java.io.IOException;

import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.SimpleCredentials;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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

@Component(
        service = { AuthenticationHandler.class },
        immediate = true,
        property = {
                SERVICE_RANKING + ":Integer=" + 9999,
                AuthenticationHandler.PATH_PROPERTY + "=/",
                "service.description=Experience AEM Token Auth Handler",
                "sling.filter.scope=REQUEST"
        })
@Designate(ocd = TokenAuthHandler.Configuration.class)
public class TokenAuthHandler implements AuthenticationHandler {
    private static final Logger log = LoggerFactory.getLogger(TokenAuthHandler.class);

    private static String AUTH_TYPE_ASSET_SELECTOR = "VISION_DAM_ASSET_PICKER";

    private static String TOKEN_PARAM = "tokenKey";

    private static final String SESSION_REQ_ATTR = TokenAuthHandler.class.getName() + ".session";

    private static final String REQUEST_URL_SUFFIX = "/j_security_check";

    private static final String LOGIN_URL = "/libs/granite/core/content/login.html";

    private static final String REQUEST_METHOD_POST = "POST";

    private static final String USER_NAME = "j_username";

    private static final String LOGIN_TOKEN = "login-token";

    private String readOnlyUser = "";

    @Reference
    private SlingRepository repository;

    @Reference
    private SimpleTokenAuthService tokenAuthService;

    //for crx on localhost two different session ids are returned, one ends with -org.apache.sling and other -org.osgi.service.http
    @java.lang.SuppressWarnings("AEM Rules:AEM-3")
    private Session localhostSession = null;

    @Reference(target = "(service.pid=com.day.crx.security.token.impl.impl.TokenAuthenticationHandler)")
    private AuthenticationHandler wrappedAuthHandler;

    @Activate
    protected void activate(final Configuration config) {
        readOnlyUser = config.read_only_user();
        localhostSession = null;
    }

    @Override
    public AuthenticationInfo extractCredentials(HttpServletRequest request, HttpServletResponse response) {
        Session userSession = (Session)request.getSession().getAttribute(SESSION_REQ_ATTR);
        AuthenticationInfo authInfo = new AuthenticationInfo(AUTH_TYPE_ASSET_SELECTOR);

        if(isLogout(request)){
            request.getSession().removeAttribute(SESSION_REQ_ATTR);
            localhostSession = null;

            try {
                removeLoginTokenCookie(request, response);
                response.sendRedirect(LOGIN_URL);
                return authInfo;
            }catch (Exception e){
                log.error("Error redirecting to login url", e);
            }
        }

        if(userSession != null){
            authInfo.put(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, userSession);
            return authInfo;
        }else if(isLocalHost(request)){
            if(localhostSession != null){
                authInfo.put(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, localhostSession);
                return authInfo;
            }
        }

        try{
            if ((REQUEST_METHOD_POST.equals(request.getMethod())) && (request.getRequestURI().endsWith(REQUEST_URL_SUFFIX))
                    && StringUtils.isNotEmpty(USER_NAME)) {
                //constant not created for "j_password" to pass sonar checks
                SimpleCredentials creds = new SimpleCredentials(request.getParameter(USER_NAME),
                        request.getParameter("j_password").toCharArray());
                userSession = this.repository.login(creds);
            }else{
                String tokenKeyInRequest = request.getParameter(TOKEN_PARAM);
                String tokenKeyConfigured = tokenAuthService.getTokenKey();

                if(StringUtils.isEmpty(tokenKeyInRequest) || !tokenKeyInRequest.equals(tokenKeyConfigured)){
                    authInfo = wrappedAuthHandler.extractCredentials(request, response);
                    return authInfo;
                }

                Session adminSession = repository.loginAdministrative(null);

                userSession = adminSession.impersonate(new SimpleCredentials(readOnlyUser, new char[0]));
            }

            request.getSession().setAttribute(SESSION_REQ_ATTR, userSession);

            if(isLocalHost(request)){
                localhostSession = userSession;
            }

            authInfo.put(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, userSession);
        }catch(RepositoryException e){
            log.error("Error could not create session for  - " + AUTH_TYPE_ASSET_SELECTOR, e);
            return AuthenticationInfo.FAIL_AUTH;
        }

        return authInfo;
    }

    private void removeLoginTokenCookie(HttpServletRequest request, HttpServletResponse response){
        Cookie[] cookies = request.getCookies();

        if(cookies == null){
            return;
        }

        for(Cookie cookie : cookies){
            if(!LOGIN_TOKEN.equals(cookie.getName())){
                continue;
            }

            cookie.setPath("/");
            cookie.setMaxAge(0);

            response.addCookie(cookie);
        }
    }

    private boolean isLogout(HttpServletRequest request){
        return request.getRequestURI().endsWith("/system/sling/logout.html");
    }

    private boolean isLocalHost(HttpServletRequest request){
        return request.getRequestURL().toString().startsWith("http://localhost:4502/");
    }

    @Override
    public boolean requestCredentials(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws IOException {
        return wrappedAuthHandler.requestCredentials(httpServletRequest, httpServletResponse);
    }

    @Override
    public void dropCredentials(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws IOException {
        wrappedAuthHandler.dropCredentials(httpServletRequest, httpServletResponse);
    }

    @ObjectClassDefinition(name = "Experience AEM Token Authentication Handler Configuration")
    public @interface Configuration {

        @AttributeDefinition(
                name = "Read only user",
                description = "Read only user for browse",
                type = AttributeType.STRING)
        String read_only_user() default "eaem-readonly-user";
    }
}
