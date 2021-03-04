package apps.experienceaem.assets.core.listeners;

import com.day.cq.search.PredicateGroup;
import com.day.cq.search.Query;
import com.day.cq.search.QueryBuilder;
import com.day.cq.search.result.Hit;
import com.day.cq.search.result.SearchResult;
import org.apache.commons.lang.StringUtils;
import org.apache.sling.api.SlingConstants;
import org.apache.sling.api.resource.*;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import javax.jcr.Session;
import java.util.HashMap;
import java.util.Map;

@Component(service = EventHandler.class,
        immediate = true,
        property = {
                EventConstants.EVENT_TOPIC + "=" + "org/apache/sling/api/resource/Resource/ADDED",
                EventConstants.EVENT_TOPIC + "=" + "org/apache/sling/api/resource/Resource/CHANGED",
                EventConstants.EVENT_TOPIC + "=" + "org/apache/sling/api/resource/Resource/REMOVED",
                EventConstants.EVENT_FILTER + "=" + "(path=/conf/global/settings/dam/adminui-extension/metadataschema/experience-aem/*)"
        }
)
public class MetadataSchemaListener implements EventHandler {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private static final String SDL_REFERENCES_RES_TYPE = "/apps/eaem-custom-metadata-asset-usage/components/asset-external-references";
    private static final String ASSET_USAGE_TITLE = "External Asset Usage";
    private static final String EAEM_SERVICE_USER = "eaem-service-user";
    private static final String REFERENCES_RES_TYPE = "dam/gui/coral/components/admin/references";

    @Reference
    private ResourceResolverFactory factory;
    @Reference
    private QueryBuilder builder;

    /**
     * Event handler
     *
     * @param event
     */
    public void handleEvent(final Event event) {
        logger.debug("Resource event: {} at: {}", event.getTopic(), event.getProperty(SlingConstants.PROPERTY_PATH));
        ResourceResolver resourceResolver = getServiceResourceResolver(factory);

        try {
            Query query = builder.createQuery(PredicateGroup.create(getQueryPredicateMap()), resourceResolver.adaptTo(Session.class));
            SearchResult result = query.getResult();
            ValueMap resVM = null;

            for (Hit hit : result.getHits()) {
                Resource res = resourceResolver.getResource(hit.getPath());

                if(res == null){
                    continue;
                }

                resVM = res.getValueMap();

                if(REFERENCES_RES_TYPE.equals(resVM.get("resourceType", String.class))){
                    updateReferencesResourceType(res);
                }
            }
            if (resourceResolver.hasChanges()) {
                resourceResolver.commit();
            }
        } catch (RepositoryException | PersistenceException e) {
            logger.error("Exception occured at handleEvent() , reason {}", e.getMessage(), e);
        }
    }

    private void updateReferencesResourceType(Resource referencesRes) {
        ModifiableValueMap mvm = referencesRes.adaptTo(ModifiableValueMap.class);

        if(ASSET_USAGE_TITLE.equals(mvm.get("fieldLabel", String.class))){
            mvm.put("resourceType", SDL_REFERENCES_RES_TYPE);
        }
    }


    /**
     * Return the query predicate map
     *
     * @return
     */
    private Map<String, String> getQueryPredicateMap() {
        Map<String, String> map = new HashMap<>();
        map.put("path", "/conf/global/settings/dam/adminui-extension/metadataschema/experience-aem");
        map.put("property", "resourceType");
        map.put("property.1_value", "dam/gui/coral/components/admin/references");
        return map;
    }

    public ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            logger.error("Could not login as SubService user {}, exiting SearchService service.", EAEM_SERVICE_USER, ex);
            return null;
        }
    }
}
