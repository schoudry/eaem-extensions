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
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.config.SocketConfig;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.scene7.ipsapi.*;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

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
import java.util.Map;

@Component(
        service = WorkflowProcess.class,
        property = { "process.label=Kohler - Migrate Smart Crops between Scene7 Accounts" })
public class MigrateSmartCropsStep implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(MigrateSmartCropsStep.class);

    private static final String EAEM_SERVICE_USER = "eaem-service-user";

    private static String SRC_S7_ACCT = "srcS7Account";

    private static String META_S7_FOLDER = "dam:scene7Folder";

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
            MetaDataMap wfData = workItem.getWorkflow().getMetaDataMap();

            setSourceS7CompanyProperties(wfData.get(SRC_S7_ACCT, String.class));

            final ResourceResolver s7ConfigResourceResolver = getServiceResourceResolver(resourceResolverFactory);
            S7Config s7Config = s7ConfigResolver.getS7ConfigForAssetPath(s7ConfigResourceResolver, assetPath);

            if (s7Config == null) {
                s7Config = s7ConfigResolver.getDefaultS7Config(s7ConfigResourceResolver);
            }
            log.info("Migrating smart crops for asset : " + assetPath);

        }catch(Exception e){
            log.error("Error occured while updating crops for payload - " + assetPath, e);
        }
    }

    private void getSourceS7AssetCropRect(S7Config s7Config, String assetPath) throws Exception{
        String s7FolderPath = getSrcS7CompanyRootFolderName(s7Config);

        SearchAssetsParam searchAssetsParam = getSrcSearchAssetsParam(s7FolderPath);

        String responseBody = makeS7Request(s7Config, getSrcS7AuthHeader(), searchAssetsParam);

        parseSearchResponse(responseBody, s7Folder);
    }

    private SearchAssetsParam getSrcSearchAssetsParam(String s7FolderPath){
        SearchAssetsParam searchAssetsParam = new SearchAssetsParam();
        StringArray assetTypes = new StringArray();
        assetTypes.getItems().add("Image");

        searchAssetsParam.setCompanyHandle(srcS7Company);
        searchAssetsParam.setFolder(s7FolderPath);
        searchAssetsParam.setIncludeSubfolders(false);
        searchAssetsParam.setAssetTypeArray(assetTypes);

        return searchAssetsParam;
    }

    private String getSrcS7CompanyRootFolderName(S7Config s7Config) throws Exception{
        GetCompanyInfoParam getCompanyInfoParam = new GetCompanyInfoParam();
        getCompanyInfoParam.setCompanyHandle(srcS7Company);

        String responseBody = makeS7Request(s7Config, getSrcS7AuthHeader(), getCompanyInfoParam);

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        Document doc = builder.parse(responseBody);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/getCompanyInfoReturn/companyInfo/name";

        Element element = (Element) xPath.compile(expression).evaluate(doc, XPathConstants.NODE);

        return element.getTextContent();
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

    public Map<String, String> getSmartCropsSubAssetHandles(S7Config s7Config, String assetHandle){
        Map<String, String> subAssetHandles = new HashMap<String, String>();

        try{
            GetAssociatedAssetsParam getAssociatedAssetsParam = new GetAssociatedAssetsParam();
            getAssociatedAssetsParam.setCompanyHandle(s7Config.getCompanyHandle());
            getAssociatedAssetsParam.setAssetHandle(assetHandle);

            AuthHeader authHeader = getDestS7AuthHeader(s7Config);

            String responseBody = makeS7Request(s7Config, authHeader, getAssociatedAssetsParam);
        }catch(Exception e){
            log.error("Error getting smart crop handles for : " + assetHandle, e);
        }

        return subAssetHandles;
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


