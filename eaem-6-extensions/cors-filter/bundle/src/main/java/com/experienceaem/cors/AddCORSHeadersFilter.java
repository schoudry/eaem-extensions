package com.experienceaem.cors;

import com.day.cq.commons.Externalizer;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.*;
import org.apache.felix.scr.annotations.sling.SlingFilter;
import org.apache.felix.scr.annotations.sling.SlingFilterScope;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;
import java.util.Dictionary;

@SlingFilter(
        name = "Experience AEM CORS Filter",
        label = "Experience AEM CORS Filter",
        metatype = true,
        scope = SlingFilterScope.REQUEST, order = -500)
public class AddCORSHeadersFilter implements Filter {
    private final Logger LOG = LoggerFactory.getLogger(getClass());

    private static final String ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    private static final String ORIGIN = "Origin";

    @Property(boolValue = false)
    private static final String ENABLE_CORS = "enable.cors";

    @Reference(cardinality = ReferenceCardinality.MANDATORY_UNARY, policy = ReferencePolicy.STATIC)
    private Externalizer externalizer;

    private boolean enableCors = false;

    private boolean isEnableCors(){
        return enableCors;
    }

    @Activate
    protected void activate(final ComponentContext context) {
        Dictionary<String, Object> props = context.getProperties();
        Object prop = props.get(ENABLE_CORS);

        if (prop != null) {
            enableCors =  Boolean.TRUE.equals(prop);
        }

        LOG.info("AddCORSHeadersFilter - CORS Enabled : " + enableCors);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                        throws IOException, ServletException {
        if (! (request instanceof SlingHttpServletRequest) || !(response instanceof SlingHttpServletResponse)) {
            return;
        }

        if (!isEnableCors()) {
            LOG.debug("AddCORSHeadersFilter - CORS Headers disabled");
            return;
        }

        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
        SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;

        String localOrigin = externalizer.absoluteLink(slingRequest, slingRequest.getScheme(), "");
        String origin = slingRequest.getHeader(ORIGIN);

        slingResponse.setHeader(ACCESS_CONTROL_ALLOW_ORIGIN, "*");

        //todo: check the origin
        /*if (StringUtils.isNotEmpty(origin) && !localOrigin.equals(origin)) {
            slingResponse.setHeader(ACCESS_CONTROL_ALLOW_ORIGIN, origin);
            LOG.debug("AddCORSHeadersFilter - Setting CORS Headers");
        }*/

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }
}
