package apps.experienceaem.assets.core.services;

import org.apache.sling.commons.json.JSONArray;
import org.osgi.annotation.versioning.ProviderType;

@ProviderType
public interface DMCService {
    public static final String SMART_CROPS_JSON = "SMART_CROPS_JSON";

    public void updateSmartCropsInS7(String assetPath, JSONArray cropsToUpdate);
}
