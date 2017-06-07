package com.experienceaem.https;

import org.apache.felix.scr.annotations.Activate;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.ConfigurationPolicy;
import org.apache.felix.scr.annotations.Service;
import org.apache.felix.scr.annotations.sling.SlingFilter;
import org.apache.felix.scr.annotations.sling.SlingFilterScope;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;
import java.net.URL;
import java.util.Dictionary;

@SlingFilter(
        label = "Experience AEM String Transport Security Filter",
        metatype = true,
        scope = SlingFilterScope.REQUEST,
        order = -500)
public class StrictTransportSecurityFilter implements Filter {
    private final Logger log = LoggerFactory.getLogger(getClass());

    @Activate
    protected void activate(final ComponentContext context) {
        log.info("StrictTransportSecurityFilter Added");
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

        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
        SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;

        if(slingRequest.getScheme().startsWith("https://")){
            chain.doFilter(request, response);
            return;
        }

        StringBuilder redirect = new StringBuilder();
        String hostName = new URL(slingRequest.getRequestURL().toString()).getHost();


        redirect.append("http://").append(hostName);

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }

}
