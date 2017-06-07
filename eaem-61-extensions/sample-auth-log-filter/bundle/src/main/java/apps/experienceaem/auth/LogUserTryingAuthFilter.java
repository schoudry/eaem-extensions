package apps.experienceaem.auth;

import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.osgi.framework.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

@Component
@Service(value = Filter.class)
@Properties({
        @Property(name = "pattern", value = "/.*"),
        @Property(name = Constants.SERVICE_RANKING, intValue = 54321),
        @Property(name = "service.description", value = "Log User Trying to Authenticate Filter")
})
public class LogUserTryingAuthFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(LogUserTryingAuthFilter.class);

    private static String J_SECURITY_CHECK = "/j_security_check";


    @Override
    public void init(FilterConfig filterConfig) {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                            throws IOException, ServletException {
        HttpServletRequest hRequest = (HttpServletRequest) request;
        String uri = hRequest.getRequestURI();

        if(uri.endsWith(J_SECURITY_CHECK)){
            //String user = hRequest.getParameter("j_username");
            //log.info("USER TRYING TO GET IN - " + user);
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }
}
