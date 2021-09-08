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
import org.apache.sling.commons.json.JSONArray;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.scene7.ipsapi.*;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

@Component(
        service = WorkflowProcess.class,
        property = { "process.label=Kohler - Migrate Smart Crops between Scene7 Accounts" })
public class MigrateSmartCropsStep implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(MigrateSmartCropsStep.class);

    @Reference
    private Scene7EndpointsManager scene7EndpointsManager;

    @Reference
    private Scene7APIClient scene7APIClient;

    @Reference
    private ProductInfoService productInfoService;

    @Reference
    private CryptoSupport cryptoSupport;

    public void execute(final WorkItem workItem, final WorkflowSession workflowSession, final MetaDataMap args)
            throws WorkflowException {
        String assetPath = getPayloadPath(workItem.getWorkflowData());

        try{
            MetaDataMap wfData = workItem.getWorkflow().getMetaDataMap();

            log.info("Migrating smart crops for asset : " + assetPath);

        }catch(Exception e){
            log.error("Error occured while updating crops for payload - " + assetPath, e);
        }
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

            String responseBody = makeS7Request(s7Config, getAssociatedAssetsParam);
        }catch(Exception e){
            log.error("Error getting smart crop handles for : " + assetHandle, e);
        }

        return subAssetHandles;
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


