package apps.experienceaem.assets.core.workfows;

import com.adobe.granite.asset.api.AssetRelation;
import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowData;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.contentsync.handler.util.RequestResponseFactory;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.AssetManager;
import com.day.cq.dam.api.Rendition;
import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.commons.mime.MimeTypeService;
import org.apache.sling.engine.SlingRequestProcessor;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@Component(
        service = WorkflowProcess.class,
        property = { "process.label=Experience AEM Convert Rendition to Asset, Workflow Process Step" }
)
public class ConvertRenditionToAssetProcess implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(ConvertRenditionToAssetProcess.class);

    private static final String RELATION_SOURCES = "sources";
    private static final String RELATION_DERIVED = "derived";
    private static final String DAM_DERIVED_ASSET = "dam:derivedAsset";
    private static final String PROCESS_ASSET_SERVLET = "/bin/asynccommand";
    private static final String PROCESS_ASSET_OPERATION = "PROCESS";
    private static final String PROCESS_ASSET_PROFILE = "full-process";

    private static String FIGMA_REND_NAME = "figma";

    @Reference
    private MimeTypeService mimeTypeService;

    @Reference
    private SlingRequestProcessor slingRequestProcessor;

    @Reference
    private RequestResponseFactory requestResponseFactory;

    public void execute(final WorkItem workItem, final WorkflowSession workflowSession, final MetaDataMap args)
            throws WorkflowException {
        String assetPath = getPayloadPath(workItem.getWorkflowData());

        try{
            ResourceResolver resolver = workflowSession.adaptTo(ResourceResolver.class);

            Resource assetRes = resolver.getResource(assetPath);

            if(assetRes == null){
                log.warn("Resource not found - " + assetRes);
                return;
            }

            String assetNameNoExt = assetRes.getName().substring(0, assetRes.getName().lastIndexOf("."));

            if(assetNameNoExt.endsWith(("-") + FIGMA_REND_NAME)){
                log.warn("Dont create Figma assets out of rendition for - " + assetPath);
                return;
            }

            Asset asset = assetRes.adaptTo(Asset.class);

            Rendition rendition = asset.getRendition(FIGMA_REND_NAME + ".jpeg");

            if (rendition == null) {
                log.warn("Unable to get rendition " + FIGMA_REND_NAME + " of asset " + assetPath);
                return;
            }

            Asset derivedAsset = createFigmaAsset(resolver, assetRes, rendition);

            if(derivedAsset == null){
                log.warn("Error creating Figma asset for : " + assetPath);
                return;
            }

            resolver.commit();

            processNewAsset(resolver, derivedAsset.getPath());
        }catch(Exception e){
            log.error("Error occured while converting rendtion to asset for payload - " + assetPath, e);
        }
    }

    private Asset createFigmaAsset(ResourceResolver resolver, Resource assetRes, Rendition rendition){
        Asset asset = assetRes.adaptTo(Asset.class);

        String assetNameNoExt = assetRes.getName().substring(0, assetRes.getName().lastIndexOf("."));

        String newAssetPath = createAssetPath(assetRes.getParent(), assetNameNoExt, rendition.getName());

        String mimeType = mimeTypeService.getMimeType(rendition.getName());

        AssetManager assetManager = resolver.adaptTo(AssetManager.class);

        Asset derivedAsset = assetManager.createOrReplaceAsset(newAssetPath, rendition.getBinary(), mimeType, false);

        if (derivedAsset == null) {
            return null;
        }

        addRelation(derivedAsset, RELATION_SOURCES, asset.getPath());

        addRelation(asset, RELATION_DERIVED, newAssetPath);

        return  derivedAsset;
    }

    private void processNewAsset(ResourceResolver resolver, String assetPath){
        Map<String, Object> requestParams = new HashMap<String, Object>();
        requestParams.put("operation", PROCESS_ASSET_OPERATION);
        requestParams.put("profile-select", PROCESS_ASSET_PROFILE);
        requestParams.put("runPostProcess", "false"); // donot run the post process, might resulting in a processing loop
        requestParams.put("description", "Processing created figma asset - " + assetPath);
        requestParams.put("asset", assetPath);

        HttpServletRequest request = requestResponseFactory.createRequest("POST", PROCESS_ASSET_SERVLET, requestParams);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        HttpServletResponse response = this.requestResponseFactory.createResponse(bos);

        try {
            slingRequestProcessor.processRequest(request, response, resolver);
        }catch (Exception e){
            log.error("Error occured while processing the new figma asset - " + assetPath);
        }
    }


    private void addRelation(Asset asset, String name, String relatedAssetPath) {
        com.adobe.granite.asset.api.Asset graniteAsset = asset.adaptTo(com.adobe.granite.asset.api.Asset.class);
        Iterator<? extends AssetRelation> relationItr = graniteAsset.listRelations(name);

        while(relationItr.hasNext()) {
            AssetRelation relation = relationItr.next();

            if( (relation == null) || relation.getAsset().getPath().equalsIgnoreCase(relatedAssetPath)){
                return;
            }
        }

        graniteAsset.addRelation(name, relatedAssetPath);
    }

    private static String createAssetPath(Resource parent, String assetNameNoExt, String renditionName) {
        return parent.getPath() + "/" + assetNameNoExt + "-" + renditionName;
    }


    private String getPayloadPath(WorkflowData wfData) {
        String payloadPath = null;

        if (wfData.getPayloadType().equals("JCR_PATH")) {
            payloadPath = (String)wfData.getPayload();
        }

        return payloadPath;
    }

}
