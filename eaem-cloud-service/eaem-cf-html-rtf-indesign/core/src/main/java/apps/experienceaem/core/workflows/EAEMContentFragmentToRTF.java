package apps.experienceaem.core.workflows;

import apps.experienceaem.core.cf2rtf.CFToRTF;
import apps.experienceaem.core.cf2rtf.CFToRTFAssetHelper;
import apps.experienceaem.core.cf2rtf.CFToRTFFragmentHelper;
import com.adobe.cq.dam.cfm.ContentFragment;
import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.dam.api.AssetManager;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import apps.experienceaem.core.cf2rtf.CFToRTFConfig;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Component(
    service = WorkflowProcess.class,
    property = {
        Constants.SERVICE_DESCRIPTION + "=Write Content Fragments to File System as RTF Files",
        Constants.SERVICE_VENDOR + "=Adobe Systems",
        EAEMContentFragmentToRTF.COMPONENT_LABEL + "=Content Fragments to RTF Files"
    }
)
public class EAEMContentFragmentToRTF implements WorkflowProcess{
    public static final String COMPONENT_LABEL = "process.label";
    private static final String HTML_MIME_TYPE = "text/html";

    private static final Logger LOG = LoggerFactory.getLogger(EAEMContentFragmentToRTF.class);
    private static final String LOG_PREFIX = "CFToRTF Workflow:";

    private static final boolean EXPAND_GROUP_MEMBERS = false;

    @Override
    public void execute(WorkItem workItem,WorkflowSession workflowSession,MetaDataMap processArguments)
        throws WorkflowException {
        String payloadPath = getPayloadPath(workItem);
        ResourceResolver resourceResolver = workflowSession.adaptTo(ResourceResolver.class);

        if (resourceResolver == null)        {
            throw new WorkflowException("Could not adapt `WorkflowSession` to `ResourceResolver`!");
        }

        AssetManager assetManager = resourceResolver.adaptTo(AssetManager.class);

        if (assetManager == null)        {
            throw new WorkflowException("Could not adapt `ResourceResolver` to `AssetManager`!");
        }

        Resource fragmentResource = resourceResolver.getResource(payloadPath);
        String configurationSource = getConfigurationSource(processArguments);
        CFToRTFConfig config = CFToRTFConfig.parse(configurationSource);

        if (fragmentResource != null)        {
            ContentFragment cf = fragmentResource.adaptTo(ContentFragment.class);

            if (cf != null){
                StringBuilder html = CFToRTFFragmentHelper.getFragmentHtmlContents(cf);

                LOG.debug("{} Extracted HTML from CF `{}`: `{}`", LOG_PREFIX, payloadPath, configurationSource);

                String rtf = CFToRTF.transpile(html.toString(), config);
                String rtfLocation = CFToRTFAssetHelper.createRTFAsset(rtf, fragmentResource, assetManager, config);

                LOG.info("{} Successfully created RTF file `{}` from CF `{}`", LOG_PREFIX, rtfLocation, payloadPath);
            }else{
                LOG.error("{} The resource {} could not converted to a `com.adobe.cq.dam.cfm.ContentFragment` instance!",LOG_PREFIX,payloadPath);
            }
        }else{
            LOG.error("{} The content fragment resource `{}` was not found!", LOG_PREFIX, payloadPath);
        }

        completeWorkflow(workItem, workflowSession);
    }

    private String getPayloadPath(WorkItem workItem){
        return workItem.getWorkflowData().getPayload().toString();
    }

    private String getConfigurationSource(MetaDataMap processArguments) {
        return String.valueOf(processArguments.get("PROCESS_ARGS", "string"));
    }

    private void completeWorkflow(WorkItem workItem, WorkflowSession workflowSession)
        throws WorkflowException {
        workflowSession.complete(workItem, workflowSession.getRoutes(workItem, EXPAND_GROUP_MEMBERS).get(0));
    }
}
