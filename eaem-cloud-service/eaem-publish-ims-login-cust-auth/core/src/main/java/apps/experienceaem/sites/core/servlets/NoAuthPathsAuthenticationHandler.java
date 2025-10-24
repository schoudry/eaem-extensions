package apps.experienceaem.sites.core.servlets;

import org.apache.sling.auth.core.spi.AuthenticationHandler;
import org.apache.sling.auth.core.spi.AuthenticationInfo;
import org.apache.sling.auth.core.spi.DefaultAuthenticationFeedbackHandler;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Custom Authentication Handler that allows specific paths to bypass authentication
 */
@Component(
    service = AuthenticationHandler.class,
    immediate = true,
    property = {
        AuthenticationHandler.PATH_PROPERTY + "=/",
        AuthenticationHandler.TYPE_PROPERTY + "=Experience AEM - No Auth Path Handler",
        "service.ranking:Integer=5000"
    }
)
@Designate(ocd = NoAuthPathsAuthenticationHandler.Config.class)
public class NoAuthPathsAuthenticationHandler extends DefaultAuthenticationFeedbackHandler implements AuthenticationHandler {
    
    private static final Logger LOG = LoggerFactory.getLogger(NoAuthPathsAuthenticationHandler.class);
    
    private Set<String> noAuthPaths = new HashSet<>();
    private boolean enabled = false;
    
    @ObjectClassDefinition(
        name = "Experience AEM - No Auth Paths Authentication Handler",
        description = "Custom authentication handler to allow specific paths without authentication"
    )
    public @interface Config {
        
        @AttributeDefinition(
            name = "Enabled",
            description = "Enable/disable the authentication handler"
        )
        boolean enabled() default true;
        
        @AttributeDefinition(
            name = "No Auth Paths",
            description = "List of paths that do not require authentication (supports wildcards with *)"
        )
        String[] noAuthPaths() default {
            "/content/eaem-publish-ims-login-cust-auth/noauth/*"
        };
    }
    
    @Activate
    @Modified
    protected void activate(Config config) {
        this.enabled = config.enabled();
        this.noAuthPaths = new HashSet<>(Arrays.asList(config.noAuthPaths()));
        LOG.info("NoAuthPathsAuthenticationHandler activated. Enabled: {}, No-auth paths: {}", enabled, noAuthPaths);
    }
    
    @Override
    public AuthenticationInfo extractCredentials(HttpServletRequest request, HttpServletResponse response) {
        if (!enabled) {
            return null;
        }
        
        String requestPath = request.getPathInfo();
        if (requestPath == null) {
            requestPath = request.getRequestURI();
        }
        
        LOG.debug("Checking authentication for path: {}", requestPath);
        
        if (isNoAuthPath(requestPath)) {
            LOG.debug("Path {} matches no-auth pattern, allowing anonymous access", requestPath);
            
            AuthenticationInfo authInfo = new AuthenticationInfo(
                AuthenticationHandler.TYPE_PROPERTY,
                "anonymous"
            );
            authInfo.put("user.jcr.credentials", "anonymous");
            
            return authInfo;
        }
        
        LOG.debug("Path {} requires authentication", requestPath);
        return null;
    }
    
    @Override
    public boolean requestCredentials(HttpServletRequest request, HttpServletResponse response) throws IOException {
        return false;
    }
    
    @Override
    public void dropCredentials(HttpServletRequest request, HttpServletResponse response) throws IOException {
    }
    
    private boolean isNoAuthPath(String path) {
        if (path == null || noAuthPaths.isEmpty()) {
            return false;
        }
        
        for (String pattern : noAuthPaths) {
            if (matchesPattern(path, pattern)) {
                return true;
            }
        }
        
        return false;
    }
    
    private boolean matchesPattern(String path, String pattern) {
        if (pattern.equals(path)) {
            return true;
        }
        
        if (pattern.contains("*")) {
            String regex = pattern
                .replace(".", "\\.")
                .replace("*", ".*");
            return path.matches(regex);
        }
        
        return false;
    }
}
