package apps.experienceaem.assets;

import com.adobe.granite.crypto.CryptoSupport;
import com.adobe.granite.license.ProductInfo;
import com.adobe.granite.license.ProductInfoService;
import com.adobe.granite.workflow.PayloadMap;
import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.commons.util.DamUtil;
import com.day.cq.dam.scene7.api.*;
import com.scene7.ipsapi.AuthHeader;
import com.scene7.ipsapi.CdnCacheInvalidationParam;
import com.scene7.ipsapi.UrlArray;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.config.SocketConfig;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.osgi.services.HttpClientBuilderFactory;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.jcr.resource.api.JcrResourceConstants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.jcr.Session;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import java.io.IOException;
import java.io.StringWriter;
import java.util.Collections;
import java.util.List;

@Component(
        immediate = true,
        service = {WorkflowProcess.class},
        property = {
            "process.label = EAEM Scene7 Invalidate CDN Cache"
        }
)
public class EAEMScene7InvalidateCDNCache implements WorkflowProcess {
    private static final Logger LOG = LoggerFactory.getLogger(EAEMScene7InvalidateCDNCache.class);

    private static final String EAEM_CACHE_INVALIDATION_PROCESS = "eaem-cache-invalidation-process";

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    @Reference
    private Scene7APIClient scene7APIClient;

    @Reference
    private Scene7Service scene7Service;

    @Reference
    private S7ConfigResolver s7ConfigResolver;

    @Reference
    private CryptoSupport cryptoSupport;

    @Reference
    private ProductInfoService productInfoService;

    @Reference
    private Scene7EndpointsManager scene7EndpointsManager;

    public void execute(final WorkItem workItem, final WorkflowSession workflowSession, final MetaDataMap arg)
                                throws WorkflowException {
        try {
            Asset asset = getAssetFromPayload(workItem, workflowSession.adaptTo(Session.class));

            ResourceResolver s7ConfigResourceResolver = resourceResolverFactory.getServiceResourceResolver(
                                    Collections.singletonMap("sling.service.subservice", (Object)EAEM_CACHE_INVALIDATION_PROCESS));

            S7Config s7Config = s7ConfigResolver.getS7ConfigForAssetPath(s7ConfigResourceResolver, asset.getPath());

            if(s7Config == null) {
                s7Config = s7ConfigResolver.getDefaultS7Config(s7ConfigResourceResolver);
            }

            CdnCacheInvalidationParam cacheInvalidationParam = getCdnCacheInvalidationParam(s7Config, asset);

            String response = makeCDNInvalidationRequest(s7Config, cacheInvalidationParam);

            if(!response.contains("<invalidationHandle>")){
                throw new Exception("Error invalidating CDN cache, Response does not contain <invalidationHandle/> element");
            }
        } catch (Exception e) {
            LOG.error("Error while invalidating CDN cache", e);
        }
    }

    public CdnCacheInvalidationParam getCdnCacheInvalidationParam(S7Config s7Config, Asset asset) throws Exception{
        String cdnInvTemplates = getCDNInvalidationTemplate(s7Config);

        LOG.debug("Scene7 CDN Invalidate template - " + cdnInvTemplates);

        String[] invalidatePaths = getCDNInvalidationPathsForAssets(cdnInvTemplates, asset).split("\n");

        UrlArray urlArray = new UrlArray();

        List<String> items = urlArray.getItems();

        Collections.addAll(items, invalidatePaths);

        CdnCacheInvalidationParam cdnCacheInvalidationParam = new CdnCacheInvalidationParam();

        cdnCacheInvalidationParam.setCompanyHandle(s7Config.getCompanyHandle());

        cdnCacheInvalidationParam.setUrlArray(urlArray);

        LOG.debug("Scene7 CDN Invalidate Paths - " + invalidatePaths);

        return cdnCacheInvalidationParam;
    }

    public String makeCDNInvalidationRequest(S7Config s7Config, CdnCacheInvalidationParam cacheInvalidationParam)
                                        throws Exception{
        ProductInfo[] prodInfo = productInfoService.getInfos();
        String password = cryptoSupport.unprotect(s7Config.getPassword());

        AuthHeader authHeader = new AuthHeader();
        authHeader.setUser(s7Config.getEmail());
        authHeader.setPassword(password);
        authHeader.setAppName(prodInfo[0].getName());
        authHeader.setAppVersion(prodInfo[0].getVersion().toString());
        authHeader.setFaultHttpStatusCode(200);

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);
        String authHeaderStr = sw.toString();

        marshaller = getMarshaller(cacheInvalidationParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(cacheInvalidationParam, sw);
        String apiMethod = sw.toString();

        StringBuilder requestBody = new StringBuilder("<Request xmlns=\"http://www.scene7.com/IpsApi/xsd/2017-10-29-beta\">");
        requestBody.append(authHeaderStr).append(apiMethod).append("</Request>");

        String uri = scene7EndpointsManager.getAPIServer(s7Config.getRegion()).toString() + "/scene7/api/IpsApiService";
        CloseableHttpClient client = null;
        String responseBody = "";

        try {
            SocketConfig sc = SocketConfig.custom().setSoTimeout(180000).build();
            client = HttpClients.custom().setDefaultSocketConfig(sc).build();

            HttpPost post = new HttpPost(uri);
            StringEntity entity = new StringEntity(requestBody.toString(), "UTF-8");

            post.addHeader("Content-Type", "text/xml");
            post.setEntity(entity);

            HttpResponse response = client.execute(post);

            HttpEntity responseEntity = response.getEntity();

            responseBody = IOUtils.toString(responseEntity.getContent(), "UTF-8");

            LOG.debug("Scene7 CDN Invalidation response - " + responseBody);
        }finally{
            if(client != null){
                client.close();
            }
        }

        return responseBody;
    }

    private Marshaller getMarshaller(Class apiMethodClass) throws JAXBException {
        Marshaller marshaller = JAXBContext.newInstance(new Class[]{apiMethodClass}).createMarshaller();
        marshaller.setProperty("jaxb.formatted.output", Boolean.valueOf(true));
        marshaller.setProperty("jaxb.fragment", Boolean.valueOf(true));
        return marshaller;
    }

    public String getCDNInvalidationPathsForAssets(String template, Asset asset) throws Exception{
        String scene7ID = asset.getMetadataValue("dam:scene7ID");
        return template.replaceAll("<ID>", scene7ID);
    }

    public String getCDNInvalidationTemplate(S7Config s7Config) throws Exception{
        String appSettingsTypeHandle = scene7Service.getApplicationPropertyHandle(s7Config);

        if(appSettingsTypeHandle == null) {
            return "";
        } else {
            Document document = scene7APIClient.getPropertySets(appSettingsTypeHandle, s7Config);

            return getPropertyValue(document, "application_cdn_invalidation_template");
        }
    }

    private String getPropertyValue(final Document document, final String name) throws Exception {
        XPath xpath = XPathFactory.newInstance().newXPath();
        String value = "";

        String expression = getLocalName("getPropertySetsReturn") + getLocalName("setArray")
                            + getLocalName("items") + getLocalName("propertyArray")
                            + getLocalName("items");

        XPathExpression xpathExpr = xpath.compile(expression);

        NodeList nodeList = (NodeList) xpathExpr.evaluate(document, XPathConstants.NODESET);
        Node nameNode, valueNode;

        for (int i = 0; i < nodeList.getLength(); i++){
            nameNode = nodeList.item(i).getFirstChild();

            if(!nameNode.getTextContent().equals(name)) {
                continue;
            }

            valueNode = nodeList.item(i).getLastChild();

            value = valueNode.getTextContent();

            break;
        }

        return value;
    }

    private String getLocalName(String name){
        return "/*[local-name()='" + name + "']";
    }

    public Asset getAssetFromPayload(final WorkItem item, final Session session) throws Exception{
        Asset asset = null;

        if (!item.getWorkflowData().getPayloadType().equals(PayloadMap.TYPE_JCR_PATH)) {
            return null;
        }

        final String path = item.getWorkflowData().getPayload().toString();
        final Resource resource = getResourceResolver(session).getResource(path);

        if (null != resource) {
            asset = DamUtil.resolveToAsset(resource);
        } else {
            LOG.error("getAssetFromPayload: asset [{}] in payload of workflow [{}] does not exist.", path,
                    item.getWorkflow().getId());
        }

        return asset;
    }

    private ResourceResolver getResourceResolver(final Session session) throws LoginException {
        return resourceResolverFactory.getResourceResolver( Collections.<String, Object>
                            singletonMap(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, session));
    }
}
