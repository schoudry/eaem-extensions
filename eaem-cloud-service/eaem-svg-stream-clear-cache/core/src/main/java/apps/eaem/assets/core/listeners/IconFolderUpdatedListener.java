package apps.eaem.assets.core.listeners;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.discovery.DiscoveryService;

import static org.apache.sling.distribution.DistributionRequestType.DELETE;
import static org.apache.sling.distribution.event.DistributionEventProperties.DISTRIBUTION_TYPE;
import static org.osgi.service.event.EventConstants.EVENT_TOPIC;

import org.apache.sling.distribution.DistributionRequest;
import org.apache.sling.distribution.DistributionRequestType;
import org.apache.sling.distribution.Distributor;
import org.apache.sling.distribution.SimpleDistributionRequest;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

import static org.apache.sling.distribution.DistributionRequestType.ADD;

import static org.apache.sling.distribution.event.DistributionEventTopics.AGENT_PACKAGE_DISTRIBUTED;
import static org.apache.sling.distribution.event.DistributionEventProperties.DISTRIBUTION_PATHS;

@Component(immediate = true, service = EventHandler.class, property = {
        EVENT_TOPIC + "=" + AGENT_PACKAGE_DISTRIBUTED
})
public class IconFolderUpdatedListener implements EventHandler {
    private static final Logger LOG = LoggerFactory.getLogger(IconFolderUpdatedListener.class);

    private static final String ICONS_FOLDER = "/content/dam/eaem-svg-stream-clear-cache";
    private static final String SPRITE_CACHE_PATH = "bin/eaem/sprite.svg";
    private static final String PUBLISH_AGENT = "publish";
    private static final String EAEM_SERVICE_USER = "eaem-service-user";

    @Reference
    private DiscoveryService discoveryService;

    @Reference
    private Distributor distributor;

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Override
    public void handleEvent(Event event) {
        String distributionType = (String) event.getProperty(DISTRIBUTION_TYPE);

        LOG.info("distributionType------->" + distributionType);

        if (!ADD.name().equals(distributionType) && !DELETE.equals(distributionType)) {
            return;
        }

        boolean isLeader = discoveryService.getTopology().getLocalInstance().isLeader();

        if (!isLeader) {
            return;
        }

        String[] paths = (String[]) event.getProperty(DISTRIBUTION_PATHS);

        List<String> iconPaths = Arrays.stream(paths).map(this::isIconFolderPath)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());

        if(CollectionUtils.isEmpty(iconPaths)){
            return;
        }

        LOG.info("Icons folder {} assets updated/deleted/published/unpublished, removing sprite cache in dispatcher");

        ResourceResolver resolver = getServiceResourceResolver(resolverFactory);

        LOG.info("------------" + resolver);

        DistributionRequest distributionRequest = new SimpleDistributionRequest(DistributionRequestType.INVALIDATE,
                                                    false, SPRITE_CACHE_PATH);

        distributor.distribute(PUBLISH_AGENT, resolver, distributionRequest);
    }

    public static ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            LOG.error("Could not login as SubService user {}", EAEM_SERVICE_USER, ex);
            return null;
        }
    }

    private String isIconFolderPath(String path){
        if(path.startsWith(ICONS_FOLDER)){
            return path;
        }

        return null;
    }
}
