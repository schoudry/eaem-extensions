package apps.experienceaem.sites.core.servlets;

import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.SyntheticResource;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MetadataOptionsSyntheticResource extends SyntheticResource {
    
    private static final String NT_FILE = "nt:file";
    
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
}
