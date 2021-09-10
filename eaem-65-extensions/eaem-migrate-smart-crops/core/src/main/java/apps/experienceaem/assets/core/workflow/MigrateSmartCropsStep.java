package apps.experienceaem.assets.core.workflow;

import com.adobe.granite.crypto.CryptoSupport;
import com.adobe.granite.license.ProductInfo;
import com.adobe.granite.license.ProductInfoService;
import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowData;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.dam.scene7.api.S7Config;
import com.day.cq.dam.scene7.api.S7ConfigResolver;
import com.day.cq.dam.scene7.api.Scene7APIClient;
import com.day.cq.dam.scene7.api.Scene7EndpointsManager;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.config.SocketConfig;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.scene7.ipsapi.*;
import com.day.cq.dam.api.Asset;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@Component(
        service = WorkflowProcess.class,
        property = { "process.label=Kohler - Migrate Smart Crops between Scene7 Accounts" })
public class MigrateSmartCropsStep implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(MigrateSmartCropsStep.class);

    private static final String EAEM_SERVICE_USER = "eaem-service-user";

    private static String SRC_S7_ACCT = "srcS7Account";

    private static String META_S7_FOLDER = "dam:scene7Folder";

    private static String META_S7_ID = "dam:scene7ID";

    @Reference
    private Scene7EndpointsManager scene7EndpointsManager;

    @Reference
    private Scene7APIClient scene7APIClient;

    @Reference
    private ProductInfoService productInfoService;

    @Reference
    private CryptoSupport cryptoSupport;

    @Reference
    private S7ConfigResolver s7ConfigResolver;

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    private String srcS7Company;
    private String srcS7User;
    private String srcS7Pass;

    public void execute(final WorkItem workItem, final WorkflowSession workflowSession, final MetaDataMap args)
            throws WorkflowException {
        String assetPath = getPayloadPath(workItem.getWorkflowData());

        try{
            log.debug("Migrating smart crops for asset : " + assetPath);

            ResourceResolver resolver = workflowSession.adaptTo(ResourceResolver.class);

            Resource resource = resolver.getResource(assetPath);

            if(resource == null){
                throw new RuntimeException("Asset not found : " + assetPath);
            }

            Asset destAsset = resource.adaptTo(Asset.class);

            String destScene7FolderPath = destAsset.getMetadataValue(META_S7_FOLDER);

            String destAssetHandle = destAsset.getMetadataValue(META_S7_ID);

            if(StringUtils.isEmpty(destScene7FolderPath)){
                throw new RuntimeException("dam:scene7Folder not available in metadata for : " + assetPath);
            }

            if (!args.containsKey("PROCESS_ARGS")){
                throw new RuntimeException("S7 Source account not set in workflow model or not in expected format srcS7Account=s7CompanyHandle/user/pass");
            }

            String srcS7Account = args.get("PROCESS_ARGS",String.class);

            srcS7Account = srcS7Account.substring(srcS7Account.indexOf("=") + 1);

            S7Config s7Config = s7ConfigResolver.getS7ConfigForAssetPath(resolver, assetPath);

            if (s7Config == null) {
                s7Config = s7ConfigResolver.getDefaultS7Config(resolver);
            }

            setSourceS7CompanyProperties(srcS7Account);

            Map<String, Map<String, String>> cropRects = getSourceS7AssetCropRect(s7Config, destScene7FolderPath, assetPath);

            Map<String, String> subAssetHandles = getDestSubAssetHandles(s7Config, destAssetHandle);

            updateDestS7SmartCrops(s7Config, subAssetHandles, destAssetHandle, cropRects);

            log.debug("Migration complete for smart crops of asset : " + assetPath);

        }catch(Exception e){
            log.error("Error occured while updating crops for payload - " + assetPath, e);
        }
    }

    private void updateDestS7SmartCrops(S7Config s7Config, Map<String, String> subAssetHandles, String assetHandle,
                                        Map<String, Map<String, String>> cropsToUpdate) throws Exception{
        UpdateSmartCropsParam updateSmartCropsParam = new UpdateSmartCropsParam();
        updateSmartCropsParam.setCompanyHandle(s7Config.getCompanyHandle());

        SmartCropUpdateArray updateArray = new SmartCropUpdateArray();
        SmartCropUpdate smartCropUpdate = null;
        NormalizedCropRect cropRect = null;

        Iterator<Map.Entry<String, String>> subAssetHandlesItr =  subAssetHandles.entrySet().iterator();
        Map.Entry<String, String> entry;
        Map<String, String> boundaries;

        while(subAssetHandlesItr.hasNext()){
            entry = subAssetHandlesItr.next();

            smartCropUpdate = new SmartCropUpdate();
            smartCropUpdate.setOwnerHandle(assetHandle);
            smartCropUpdate.setSubAssetHandle(entry.getValue());

            cropRect = new NormalizedCropRect();
            boundaries = cropsToUpdate.get(entry.getKey());

            cropRect.setLeftN(Double.parseDouble(boundaries.get("leftN")));
            cropRect.setTopN(Double.parseDouble(boundaries.get("topN")));
            cropRect.setWidthN(Double.parseDouble(boundaries.get("widthN")));
            cropRect.setHeightN(Double.parseDouble(boundaries.get("heightN")));

            smartCropUpdate.setCropRect(cropRect);
            updateArray.getItems().add(smartCropUpdate);
        }

        updateSmartCropsParam.setUpdateArray(updateArray);

        String responseBody = makeS7Request(s7Config, getDestS7AuthHeader(s7Config), updateSmartCropsParam);

        int totalUpdated = Integer.parseInt(getSingleElementTextContent(responseBody, "/updateSmartCropsReturn/successCount"));

        if(updateArray.getItems().size() != totalUpdated){
            throw new Exception("Updated count : " + totalUpdated + ", doesnt match total count : " + updateArray.getItems().size());
        }
    }

    public Map<String, String> getDestSubAssetHandles(S7Config s7Config, String assetHandle) throws Exception{
        GetAssociatedAssetsParam getAssociatedAssetsParam = new GetAssociatedAssetsParam();
        getAssociatedAssetsParam.setCompanyHandle(s7Config.getCompanyHandle());
        getAssociatedAssetsParam.setAssetHandle(assetHandle);

        String responseBody = makeS7Request(s7Config, getDestS7AuthHeader(s7Config), getAssociatedAssetsParam);

        Map<String, String> subAssetHandles = new HashMap<String, String>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody.getBytes());

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/getAssociatedAssetsReturn/subAssetArray/items";

        NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);
        String subAssetHandle = null, name, cropRectStr;

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

    private Map<String, Map<String, String>> getSourceS7AssetCropRect(S7Config s7Config, String destScene7FolderPath, String assetPath) throws Exception{
        String rootPath = getSrcS7CompanyRootFolderName(s7Config).trim();

        if(rootPath.endsWith("/")){
            rootPath = rootPath.substring(0, rootPath.lastIndexOf("/"));
        }

        String srcS7FolderPath = rootPath + destScene7FolderPath.substring(destScene7FolderPath.indexOf("/"));

        String assetName = assetPath.substring(assetPath.lastIndexOf("/") + 1);

        SearchAssetsByMetadataParam searchAssetsParam = getSrcSearchAssetParam(srcS7FolderPath, assetName);

        String responseBody = makeS7Request(s7Config, getSrcS7AuthHeader(), searchAssetsParam);

        String srcS7AssetHandle = getSingleElementTextContent(responseBody, "/searchAssetsByMetadataReturn/assetSummaryArray/items/assetHandle");

        GetAssociatedAssetsParam getAssociatedAssetsParam = new GetAssociatedAssetsParam();
        getAssociatedAssetsParam.setCompanyHandle(srcS7Company);
        getAssociatedAssetsParam.setAssetHandle(srcS7AssetHandle);

        responseBody = makeS7Request(s7Config, getSrcS7AuthHeader(), getAssociatedAssetsParam);

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        Document doc = builder.parse(new ByteArrayInputStream(responseBody.getBytes()));

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/getAssociatedAssetsReturn/subAssetArray/items";

        NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);

        Map<String, Map<String, String>> cropRects = new HashMap<String, Map<String, String>>();
        Map<String, String> cropRect = null;

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            Element eElement = (Element) item;

            String name = eElement.getElementsByTagName("name").item(0).getTextContent();

            cropRect = new HashMap<String, String>();

            try{
                Element cropRectEle = (Element)((Element)eElement.getElementsByTagName("smartCrop").item(0))
                        .getElementsByTagName("cropRect").item(0);

                cropRect.put("leftN", cropRectEle.getElementsByTagName("leftN").item(0).getTextContent());
                cropRect.put("topN", cropRectEle.getElementsByTagName("topN").item(0).getTextContent());
                cropRect.put("widthN", cropRectEle.getElementsByTagName("widthN").item(0).getTextContent());
                cropRect.put("heightN", cropRectEle.getElementsByTagName("heightN").item(0).getTextContent());
            }catch(Exception ce){
                //ignore no smart crop images
            }

            cropRects.put(name, cropRect);
        }

        return cropRects;
    }

    private String getSingleElementTextContent(String responseBody, String expression) throws Exception{
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        Document doc = builder.parse(new ByteArrayInputStream(responseBody.getBytes()));

        XPath xPath =  XPathFactory.newInstance().newXPath();

        Element element = (Element) xPath.compile(expression).evaluate(doc, XPathConstants.NODE);

        return element.getTextContent();
    }

    private SearchAssetsByMetadataParam getSrcSearchAssetParam(String s7FolderPath, String assetName){
        SearchAssetsByMetadataParam searchAssetsParam = new SearchAssetsByMetadataParam();
        MetadataConditionArray metaCondArray = new MetadataConditionArray();

        MetadataCondition condition = new MetadataCondition();
        condition.setFieldHandle("file_name");
        condition.setOp("Equals");
        condition.setValue(assetName);

        metaCondArray.getItems().add(condition);

        condition = new MetadataCondition();
        condition.setFieldHandle("folder_path");
        condition.setOp("Contains");
        condition.setValue(s7FolderPath);

        metaCondArray.getItems().add(condition);

        searchAssetsParam.setCompanyHandle(srcS7Company);
        searchAssetsParam.setMetadataConditionArray(metaCondArray);

        return searchAssetsParam;
    }

    private String getSrcS7CompanyRootFolderName(S7Config s7Config) throws Exception{
        GetCompanyInfoParam getCompanyInfoParam = new GetCompanyInfoParam();
        getCompanyInfoParam.setCompanyHandle(srcS7Company);

        String responseBody = makeS7Request(s7Config, getSrcS7AuthHeader(), getCompanyInfoParam);

        return getSingleElementTextContent(responseBody, "/getCompanyInfoReturn/companyInfo/rootPath");
    }

    private void setSourceS7CompanyProperties(String srcAccount){
        String[] words = srcAccount.split("/");

        if(words.length != 3){
            log.error("Source Account property format is 's7CompanyHandle/user/pass' eg.'c|230095/user@company.com/password'");
            throw new RuntimeException("S7 Source account not in expected format srcS7Account=s7CompanyHandle/user/pass");
        }

        srcS7Company = words[0];
        srcS7User = words[1];
        srcS7Pass = words[2];
    }

    private String getPayloadPath(WorkflowData wfData) {
        String payloadPath = null;

        if (wfData.getPayloadType().equals("JCR_PATH")) {
            payloadPath = (String)wfData.getPayload();
        }

        return payloadPath;
    }

    private String makeS7Request(S7Config s7Config, AuthHeader authHeader, Object param) throws Exception{
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

    private AuthHeader getDestS7AuthHeader(S7Config s7Config) throws Exception{
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

    private AuthHeader getSrcS7AuthHeader() throws Exception{
        ProductInfo[] prodInfo = productInfoService.getInfos();

        AuthHeader authHeader = new AuthHeader();
        authHeader.setUser(srcS7User);
        authHeader.setPassword(srcS7Pass);
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

    public static ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            log.error("Could not login as SubService user {}, exiting service.", "eaem-service-user", ex);
            return null;
        }
    }
}


