package apps.experienceaem.assets.core.listeners;

import com.day.cq.contentsync.handler.util.RequestResponseFactory;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.apache.sling.api.resource.observation.ResourceChangeListener;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONObject;
import org.apache.sling.engine.SlingRequestProcessor;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.propertytypes.ServiceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.util.*;

@Component(
        service = ResourceChangeListener.class,
        immediate = true,
        property = {
                ResourceChangeListener.CHANGES + "=CHANGED",
                ResourceChangeListener.PATHS + "=glob:/content/dam"
        })
@ServiceDescription("Experience AEM - Invalidate CDN Cache on Asset Create")
public class S7CDNCacheInvalidateListener implements ResourceChangeListener {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private static final String S7_CDN_INVALIDATE_SERVLET = "/mnt/overlay/dam/gui/content/s7dam/cdninvalidation/cdninvalidationwizard.s7cdninvalidation.json";

    private static final String S7_CDN_INVALIDATE_URLS = "/mnt/overlay/dam/gui/content/s7dam/cdninvalidation/cdninvalidationwizard.s7cdncacheurls.json";

    @Reference
    ResourceResolverFactory resolverFactory;

    @Reference
    private SlingRequestProcessor slingRequestProcessor;

    @Reference
    private RequestResponseFactory requestResponseFactory;

    public void onChange(List<ResourceChange> changes) {
        String assetMetadataPath = null;
        Iterator<ResourceChange> changesItr = changes.iterator();
        ResourceChange change = null;

        while(changesItr.hasNext()){
            change = changesItr.next();

            if(!change.getPath().endsWith("/jcr:content/metadata")){
                continue;
            }

            assetMetadataPath = change.getPath();

            break;
        };

        if(StringUtils.isEmpty(assetMetadataPath)){
            return;
        }

        Map<String, Object> subServiceUser = new HashMap<String, Object>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, "eaem-user-s7-admin");

        ResourceResolver resourceResolver = null;

        try {
            resourceResolver = resolverFactory.getServiceResourceResolver(subServiceUser);

            Resource assetMetaRes = resourceResolver.getResource(assetMetadataPath);

            String scene7FileName = assetMetaRes.getValueMap().get("dam:scene7File", "");

            if(StringUtils.isEmpty(scene7FileName)){
                return;
            }

            List<String> urls = getInvalidateUrls(resourceResolver, assetMetadataPath);

            if(CollectionUtils.isEmpty(urls)){
                logger.info("Nothing to s7 cdn invalidate for asset " + assetMetadataPath);
                return;
            }

            logger.info("Invalidate the urls : " + urls);

            invalidateS7CDNCache(resourceResolver, urls);
        } catch (final Exception e) {
            logger.error("Error invalidating cache : {}", e.getMessage(), e);
        } finally {
            if ((resourceResolver != null) && resourceResolver.isLive()) {
                resourceResolver.close();
            }
        }
    }

    private void invalidateS7CDNCache(ResourceResolver resourceResolver, List<String> urls) throws Exception{
        Map<String, Object> requestParams = new LinkedHashMap<String, Object>();
        requestParams.put("urls", String.join("&", urls));

        HttpServletRequest request = requestResponseFactory.createRequest("POST", S7_CDN_INVALIDATE_SERVLET,
                                        requestParams);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        HttpServletResponse response = this.requestResponseFactory.createResponse(bos);
        HttpServletRequestWrapper wrapperRequest = new URLsSlingServletRequestWrapper(request);

        slingRequestProcessor.processRequest(wrapperRequest, response, resourceResolver);

        response.getWriter().flush();

        JSONObject invalidateResponse = new JSONObject(bos.toString());

        if(!invalidateResponse.has("invalidationHandle")){
            return;
        }

        logger.info("Successfully invalidate s7 cache for urls " + urls);
    }

    private List<String> getInvalidateUrls(ResourceResolver resourceResolver, String assetMetadataPath) throws Exception{
        Map<String, Object> requestParams = new HashMap<String, Object>();
        requestParams.put("paths", assetMetadataPath.substring(0, assetMetadataPath.indexOf("/jcr:content")));
        requestParams.put("template", "true");
        requestParams.put("presets", "true");

        HttpServletRequest request = requestResponseFactory.createRequest("POST", S7_CDN_INVALIDATE_URLS,
                requestParams);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        HttpServletResponse response = this.requestResponseFactory.createResponse(bos);

        slingRequestProcessor.processRequest(request, response, resourceResolver);

        response.getWriter().flush();

        JSONObject invalidateURLsJSON = new JSONObject(bos.toString());

        List<String> invalidateUrls = new ArrayList<String>();

        if(!invalidateURLsJSON.has("urls")){
            return invalidateUrls;
        }

        JSONArray invalidateArray = invalidateURLsJSON.getJSONArray("urls");

        for(int i = 0; i < invalidateArray.length(); i++){
            invalidateUrls.add(invalidateArray.getString(i));
        }

        return invalidateUrls;
    }

    private class URLsSlingServletRequestWrapper extends HttpServletRequestWrapper {
        public URLsSlingServletRequestWrapper(final HttpServletRequest request) {
            super(request);
        }

        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> pMap = super.getParameterMap();

            String[] urls = String.valueOf(pMap.get("urls")[0]).split("&");

            pMap.put("urls", urls);

            return pMap;
        }
    }
}