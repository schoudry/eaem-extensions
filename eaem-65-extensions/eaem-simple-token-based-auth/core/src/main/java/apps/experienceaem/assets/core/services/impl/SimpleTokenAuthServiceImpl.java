package apps.experienceaem.assets.core.services.impl;

import apps.experienceaem.assets.core.services.SimpleTokenAuthService;
import jdk.nashorn.internal.ir.annotations.Reference;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by nalabotu on 10/5/2021.
 */
public class SimpleTokenAuthServiceImpl implements SimpleTokenAuthService{
    protected final static Logger log = LoggerFactory.getLogger(SimpleTokenAuthServiceImpl.class);

    private static final String EAEM_SERVICE_USER = "eaem-service-user";

    public String CONFIG_PATH = "/conf/global/settings/dam/aem-vision-dam";

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    @Override
    public String getTokenKey() {
        String tokenKey = "";
        final String configPath = CONFIG_PATH;
        final ResourceResolver resourceResolver = getServiceResourceResolver(resourceResolverFactory);

        final Resource configRes = resourceResolver.getResource(configPath);

        if (configRes == null) {
            return tokenKey;
        }

        tokenKey = configRes.getValueMap().get("tokenKey", String.class);

        if (tokenKey == null) {
            tokenKey = "";
        }

        return tokenKey;
    }

    public static ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            log.error("Could not login as SubService user {}", EAEM_SERVICE_USER, ex);
            return null;
        }
    }
}
