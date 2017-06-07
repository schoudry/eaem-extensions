package apps.experienceaem.dt;

import org.apache.felix.scr.annotations.Activate;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.sling.SlingFilter;
import org.apache.felix.scr.annotations.sling.SlingFilterScope;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.settings.SlingSettingsService;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.*;
import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.Dictionary;

@SlingFilter(
        metatype = true,
        label = "Experience AEM Download Tracker",
        description = "Experience AEM Download Tracker",
        scope = SlingFilterScope.REQUEST, order = -501)
public class DownloadTracker implements Filter {
    private final Logger LOG = LoggerFactory.getLogger(getClass());

    @Reference
    protected SlingSettingsService slingSettings;

    @Activate
    protected void activate(final ComponentContext context) {
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (! (request instanceof SlingHttpServletRequest) || !(response instanceof SlingHttpServletResponse)) {
            chain.doFilter(request, response);
            return;
        }

        try{
            SlingHttpServletRequest sRequest = (SlingHttpServletRequest) request;
            String rURI = sRequest.getRequestURI();

            //track assetdownload.zip selectors
            if(!rURI.contains(".assetdownload.zip") || !rURI.endsWith(".zip")){
                chain.doFilter(request, response);
                return;
            }

            ResourceResolver resolver = sRequest.getResourceResolver();
            Session userSession = resolver.adaptTo(Session.class);

            if(userSession == null){
                chain.doFilter(request, response);
                return;
            }

            StringBuilder sb = new StringBuilder();
            Date d = new Date();

            for(String path : sRequest.getParameterValues("path")){
                sb.append(userSession.getUserID()).append("\t")
                        .append(d)
                        .append("\t")
                        .append(path)
                        .append("\n");
            }

            LOG.info(sb.toString());
        }catch(Exception e){
            LOG.error("Error tracking download", e);
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }
}
