package apps.experienceaem.assets.core.services;

import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.commons.json.JSONArray;
import org.osgi.annotation.versioning.ProviderType;

@ProviderType
public interface EAEMDMService {
    public String getS7TestContext(String assetPath);

    public String getS7TestContextUrl(final String assetPath, final String deliveryUrl);

    public ResourceResolver getServiceResourceResolver();
}
