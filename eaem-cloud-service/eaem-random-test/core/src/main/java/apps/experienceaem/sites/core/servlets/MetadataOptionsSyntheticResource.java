package apps.experienceaem.sites.core.servlets;

import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.SyntheticResource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.wrappers.ValueMapDecorator;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;

public class MetadataOptionsSyntheticResource extends SyntheticResource {
    
    private static final String NT_FILE = "nt:file";
    private static final String JCR_DATA = "jcr:data";
    private static final String JCR_MIMETYPE = "jcr:mimeType";
    
    private final String path;
    private final String data;

    public MetadataOptionsSyntheticResource(ResourceResolver resourceResolver, String path, String data) {
        super(resourceResolver, path, NT_FILE);
        this.path = path;
        this.data = data;
    }

    @SuppressWarnings("unchecked")
    @Override
    public <AdapterType> AdapterType adaptTo(Class<AdapterType> type) {
        if (type == InputStream.class) {
            return (AdapterType) new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8));
        }
        return super.adaptTo(type);
    }
    
    private class ContentResource extends SyntheticResource {
        public ContentResource(ResourceResolver resourceResolver, String path) {
            super(resourceResolver, path, "nt:resource");
        }
        
        @SuppressWarnings("unchecked")
        @Override
        public <AdapterType> AdapterType adaptTo(Class<AdapterType> type) {
            if (type == InputStream.class) {
                return (AdapterType) new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8));
            }
            if (type == ValueMap.class) {
                HashMap<String, Object> props = new HashMap<>();
                props.put(JCR_DATA, new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8)));
                props.put(JCR_MIMETYPE, "application/json");
                return (AdapterType) new ValueMapDecorator(props);
            }
            return super.adaptTo(type);
        }
    }
}
