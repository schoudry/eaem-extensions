package apps.experienceaem.core.ids;

import com.google.gson.JsonObject;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;

import java.util.Map;

public interface IDSService {
    public JsonObject executeInDesignServerRequest(ResourceResolver resolver, String payload) throws Exception;

    public String buildSOAPPayload(ResourceResolver resolver, Map<String, String> scriptArs, String[] customScripts);
}
