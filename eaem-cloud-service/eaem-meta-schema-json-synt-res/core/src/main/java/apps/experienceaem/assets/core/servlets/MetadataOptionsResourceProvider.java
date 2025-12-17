package apps.experienceaem.assets.core.servlets;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.spi.resource.provider.ResolveContext;
import org.apache.sling.spi.resource.provider.ResourceContext;
import org.apache.sling.spi.resource.provider.ResourceProvider;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.day.cq.contentsync.handler.util.RequestResponseFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.ByteArrayOutputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@Component(
    service = ResourceProvider.class,
    property = {
        ResourceProvider.PROPERTY_ROOT + "=/content/api/eaem",
        ResourceProvider.PROPERTY_MODIFIABLE + "=false"
    }
)
public class MetadataOptionsResourceProvider extends ResourceProvider<Object> {
    
    private static final Logger LOG = LoggerFactory.getLogger(MetadataOptionsResourceProvider.class);
    
    private static final String RESOURCE_PATH = "/content/api/eaem/metadata-options.json";
    private static final String JSON_FEED_SERVLET_PATH = "/bin/eaem/metadata/options";

    @Reference
    private RequestResponseFactory requestResponseFactory;

    @Reference
    private SlingRequestProcessor slingRequestProcessor;

    @Override
    public Resource getResource(ResolveContext<Object> ctx, String path, ResourceContext resourceContext, Resource parent) {
        if (RESOURCE_PATH.equals(path)) {
            return createMetadataOptionsResource(ctx.getResourceResolver());
        }
        return null;
    }
    
    @Override
    public Iterator<Resource> listChildren(ResolveContext<Object> ctx, Resource parent) {
        return Collections.emptyIterator();
    }
    
    private Resource createMetadataOptionsResource(ResourceResolver resolver) {
        String jsonData = "{}";

        try {
            Map<String, Object> requestParams = new HashMap<String, Object>();
            HttpServletRequest request = (HttpServletRequest) requestResponseFactory.createRequest("GET", JSON_FEED_SERVLET_PATH,requestParams);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();

            HttpServletResponse response = (HttpServletResponse) this.requestResponseFactory.createResponse(bos);

            slingRequestProcessor.processRequest(request, response, resolver);

            response.getWriter().flush();

            jsonData = bos.toString();
        } catch (Exception e) {
            LOG.error("Error fetching data from servlet: {}", JSON_FEED_SERVLET_PATH, e);
        }
        
        return new MetadataOptionsSyntheticResource(resolver, RESOURCE_PATH, jsonData);
    }
}

