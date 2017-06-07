package apps.experienceaem.inbox;

import com.day.cq.dam.api.Asset;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.ui.JcrPayloadPathBuilder;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.framework.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Component(metatype = false)
@Service
@Properties({
    @Property(name = Constants.SERVICE_DESCRIPTION, value = "Experience AEM Classic UI Inbox Asset Url"),
    @Property(name = "service.ranking", intValue = -1306, propertyPrivate = false)
})
public class ClassicUIAssetUrlPathBuilder implements JcrPayloadPathBuilder {
    private static final Logger log = LoggerFactory.getLogger(ClassicUIAssetUrlPathBuilder.class);

    private static String EAEM_FOLDER = "/content/dam/experience-aem";

    @Reference
    private ResourceResolverFactory resolverFactory;

    public String buildPath(WorkItem item) {
        ResourceResolver srvResolver = null;

        try {
            if (!item.getWorkflowData().getPayloadType().equals("JCR_PATH")) {
                return null;
            }

            String path = item.getWorkflowData().getPayload().toString();

            Map<String, Object> authMap = new HashMap<String, Object>();
            authMap.put(ResourceResolverFactory.SUBSERVICE, "pathbuilder");

            srvResolver = resolverFactory.getServiceResourceResolver(authMap);

            Resource res = srvResolver.getResource(path);

            if (res == null || !StringUtils.startsWith(res.getPath(), EAEM_FOLDER)) {
                return null;
            }

            if (res.adaptTo(Asset.class) != null) {
                return "/damadmin#" + res.getPath();
            }
        } catch (Exception e) {
            log.warn("Error creating inbox asset url", e);
        } finally {
            if (srvResolver != null) {
                srvResolver.close();
            }
        }

        return null;
    }
}
