package apps.experienceaem.assets.core.services.impl;

import apps.experienceaem.assets.core.services.DMCService;
import com.adobe.granite.crypto.CryptoSupport;
import com.adobe.granite.license.ProductInfo;
import com.adobe.granite.license.ProductInfoService;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.scene7.api.*;
import com.scene7.ipsapi.*;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.config.SocketConfig;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.sling.api.resource.*;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONObject;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.*;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

@Component(service = DMCService.class)
public class DMCServiceImpl implements DMCService {
    private static final Logger log = LoggerFactory.getLogger(DMCServiceImpl.class);

    private static final String EAEM_SERVICE_USER = "eaem-service-user";

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    @Reference
    private Scene7Service scene7Service;

    @Reference
    private S7ConfigResolver s7ConfigResolver;

    @Reference
    private Scene7APIClient scene7APIClient;

    @Reference
    private ProductInfoService productInfoService;

    @Reference
    private CryptoSupport cryptoSupport;

    @Reference
    private Scene7EndpointsManager scene7EndpointsManager;

    public Map<String, String> getSmartCropsSubAssetHandles(S7Config s7Config, String assetHandle){
        Map<String, String> subAssetHandles = new HashMap<String, String>();

        try{
            GetAssociatedAssetsParam getAssociatedAssetsParam = new GetAssociatedAssetsParam();
            getAssociatedAssetsParam.setCompanyHandle(s7Config.getCompanyHandle());
            getAssociatedAssetsParam.setAssetHandle(assetHandle);

            String responseBody = makeS7Request(s7Config, getAssociatedAssetsParam);

            subAssetHandles = parseResponseForSubAssetHandles(responseBody.getBytes());
        }catch(Exception e){
            log.error("Error getting smart crop handles for : " + assetHandle, e);
        }

        return subAssetHandles;
    }

    public static ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            log.error("Could not login as SubService user {}, exiting SearchService service.", "disney-user-admin", ex);
            return null;
        }
    }

    public void updateSmartCropsInS7(String assetPath, JSONArray cropsToUpdate){
        final ResourceResolver s7ConfigResourceResolver = getServiceResourceResolver(resourceResolverFactory);
        S7Config s7Config = s7ConfigResolver.getS7ConfigForAssetPath(s7ConfigResourceResolver, assetPath);

        if (s7Config == null) {
            s7Config = s7ConfigResolver.getDefaultS7Config(s7ConfigResourceResolver);
        }

        if((cropsToUpdate == null) || (cropsToUpdate.length() == 0)){
            log.info("No crops to update for asset : " + assetPath);
            return;
        }

        try{
            JSONObject smartCrop = cropsToUpdate.getJSONObject(0);
            String id = null, ownerHandle, subAssetHandle;

            id = smartCrop.getString("id");
            ownerHandle = id.substring(0, id.lastIndexOf("__")).replace("_", "|");

            Map<String, String> subAssetHandles = getSmartCropsSubAssetHandles(s7Config, ownerHandle);

            log.debug("subAssetHandles - " + subAssetHandles);

            UpdateSmartCropsParam updateSmartCropsParam = new UpdateSmartCropsParam();
            updateSmartCropsParam.setCompanyHandle(s7Config.getCompanyHandle());

            SmartCropUpdateArray updateArray = new SmartCropUpdateArray();
            SmartCropUpdate smartCropUpdate = null;
            NormalizedCropRect cropRect = null;

            double leftN, topN;

            for(int i = 0; i < cropsToUpdate.length(); i++){
                smartCrop = cropsToUpdate.getJSONObject(i);

                smartCropUpdate = new SmartCropUpdate();
                id = smartCrop.getString("id");

                ownerHandle = id.substring(0, id.lastIndexOf("__")).replace("_", "|");
                subAssetHandle = subAssetHandles.get(smartCrop.getString("name"));

                log.debug("subAssetHandle - " + subAssetHandle + ", for name : " + smartCrop.getString("name"));

                if(StringUtils.isEmpty(subAssetHandle)){
                    continue;
                }

                smartCropUpdate.setOwnerHandle(ownerHandle);
                smartCropUpdate.setSubAssetHandle(subAssetHandle);

                cropRect = new NormalizedCropRect();

                leftN = Double.parseDouble(smartCrop.getString("leftN")) / 100;
                topN = Double.parseDouble(smartCrop.getString("topN")) / 100;

                cropRect.setLeftN(leftN);
                cropRect.setTopN(topN);
                cropRect.setWidthN(1 - (Double.parseDouble(smartCrop.getString("rightN")) / 100) - leftN);
                cropRect.setHeightN(1 - (Double.parseDouble(smartCrop.getString("bottomN")) / 100) - topN);

                smartCropUpdate.setCropRect(cropRect);

                updateArray.getItems().add(smartCropUpdate);
            }

            updateSmartCropsParam.setUpdateArray(updateArray);

            makeS7Request(s7Config, updateSmartCropsParam);
        }catch(Exception e){
            log.error("Error updating smart crops for : " + assetPath, e);
        }
    }

    private String makeS7Request(S7Config s7Config, Object param) throws Exception{
        AuthHeader authHeader = getS7AuthHeader(s7Config);
        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);
        String authHeaderStr = sw.toString();

        marshaller = getMarshaller(param.getClass());
        sw = new StringWriter();
        marshaller.marshal(param, sw);
        String apiMethod = sw.toString();

        StringBuilder requestBody = new StringBuilder("<Request xmlns=\"http://www.scene7.com/IpsApi/xsd/2017-10-29-beta\">");
        requestBody.append(authHeaderStr).append(apiMethod).append("</Request>");

        String uri = scene7EndpointsManager.getAPIServer(s7Config.getRegion()).toString() + "/scene7/api/IpsApiService";
        CloseableHttpClient client = null;
        String responseBody = "";

        SocketConfig sc = SocketConfig.custom().setSoTimeout(180000).build();
        client = HttpClients.custom().setDefaultSocketConfig(sc).build();

        HttpPost post = new HttpPost(uri);
        StringEntity entity = new StringEntity(requestBody.toString(), "UTF-8");

        post.addHeader("Content-Type", "text/xml");
        post.setEntity(entity);

        HttpResponse response = client.execute(post);

        HttpEntity responseEntity = response.getEntity();

        responseBody = IOUtils.toString(responseEntity.getContent(), "UTF-8");

        log.info("Scene7 response - " + responseBody);

        return responseBody;
    }

    private static Map<String, String> parseResponseForSubAssetHandles(byte[] responseBody) throws Exception{
        Map<String, String> subAssetHandles = new HashMap<String, String>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/getAssociatedAssetsReturn/subAssetArray/items";

        NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);
        String subAssetHandle = null, name;

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() == Node.ELEMENT_NODE) {
                Element eElement = (Element) item;

                subAssetHandle = eElement.getElementsByTagName("subAssetHandle").item(0).getTextContent();
                name = eElement.getElementsByTagName("name").item(0).getTextContent();

                subAssetHandles.put(name, subAssetHandle);
            }
        }

        return subAssetHandles;
    }

    private AuthHeader getS7AuthHeader(S7Config s7Config) throws Exception{
        ProductInfo[] prodInfo = productInfoService.getInfos();
        String password = cryptoSupport.unprotect(s7Config.getPassword());

        AuthHeader authHeader = new AuthHeader();
        authHeader.setUser(s7Config.getEmail());
        authHeader.setPassword(password);
        authHeader.setAppName(prodInfo[0].getName());
        authHeader.setAppVersion(prodInfo[0].getVersion().toString());
        authHeader.setFaultHttpStatusCode(200);

        return authHeader;
    }

    private Marshaller getMarshaller(Class apiMethodClass) throws JAXBException {
        Marshaller marshaller = JAXBContext.newInstance(new Class[]{apiMethodClass}).createMarshaller();
        marshaller.setProperty("jaxb.formatted.output", Boolean.valueOf(true));
        marshaller.setProperty("jaxb.fragment", Boolean.valueOf(true));
        return marshaller;
    }
}
