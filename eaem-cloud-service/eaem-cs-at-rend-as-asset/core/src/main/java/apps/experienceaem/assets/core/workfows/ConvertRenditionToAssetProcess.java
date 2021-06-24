package apps.experienceaem.assets.core.workfows;

import com.adobe.granite.asset.api.AssetRelation;
import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowData;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.AssetManager;
import com.day.cq.dam.api.Rendition;
import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.commons.mime.MimeTypeService;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Binary;
import java.util.Iterator;

@Component(
        service = WorkflowProcess.class,
        property = { "process.label=Experience AEM Convert Rendition to Asset, Workflow Process Step" }
)
public class ConvertRenditionToAssetProcess implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(ConvertRenditionToAssetProcess.class);

    private static final String RELATION_SOURCES = "sources";
    private static final String RELATION_DERIVED = "derived";
    private static final String DAM_DERIVED_ASSET = "dam:derivedAsset";

    private static String FIGMA_REND_NAME = "figma";

    @Reference
    private MimeTypeService mimeTypeService;

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

            String newAssetPath = createAssetPath(assetRes.getParent(), assetNameNoExt, rendition.getName());

            String mimeType = mimeTypeService.getMimeType(rendition.getName());

            AssetManager assetManager = resolver.adaptTo(AssetManager.class);

            Asset derivedAsset = assetManager.createOrReplaceAsset(newAssetPath, rendition.getBinary(), mimeType, false);

            if (derivedAsset == null) {
                log.warn("Error creating Figma asset for : " + assetPath);
                return;
            }

            addRelation(derivedAsset, RELATION_SOURCES, asset.getPath());

            addRelation(asset, RELATION_DERIVED, newAssetPath);

            Resource derivedAssetResource = derivedAsset.adaptTo(Resource.class);

            ModifiableValueMap valueMap = derivedAssetResource.adaptTo(ModifiableValueMap.class);

            valueMap.put(DAM_DERIVED_ASSET, true);

            resolver.commit();
        }catch(Exception e){
            log.error("Error occured while converting rendtion to asset for payload - " + assetPath, e);
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
