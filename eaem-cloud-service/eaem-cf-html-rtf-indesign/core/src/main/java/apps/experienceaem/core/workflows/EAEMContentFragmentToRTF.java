package apps.experienceaem.core.workflows;

import com.adobe.cq.dam.cfm.ContentFragment;
import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.dam.api.AssetManager;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;

@Component(
    service = WorkflowProcess.class,
    property = {
        Constants.SERVICE_DESCRIPTION + "=Write Content Fragments to File System as RTF Files",
        Constants.SERVICE_VENDOR + "=Adobe Systems",
        ContentFragmentToRTF.COMPONENT_LABEL + "=Content Fragments to RTF Files"
    }
)
public class EAEMContentFragmentToRTF implements WorkflowProcess
{

    public static final String COMPONENT_LABEL = "process.label";

    private static final String CONFIG_KEY = "PROCESS_ARGS";
    private static final String CONFIG_TYPE = "string";

    private static final Logger LOG = CFToRTFLogger.LOG;
    private static final String LOG_PREFIX = CFToRTFLogger.LOG_PREFIX;

    private static final boolean EXPAND_GROUP_MEMBERS = false;

    /**
     * Execute the CF to RTF process on the specified `workItem`.
     * @param workItem Expected to wrap an AEM content fragment path
     * @param workflowSession The workflow session
     * @param processArguments The arguments passed to this process step
     */
    @Override
    public void execute(
            WorkItem workItem,
            WorkflowSession workflowSession,
            MetaDataMap processArguments
    )
    throws WorkflowException
    {

        String payloadPath = getPayloadPath(workItem);
        ResourceResolver resourceResolver = workflowSession.adaptTo(ResourceResolver.class);

        if (resourceResolver == null)
        {
            throw new WorkflowException("Could not adapt `WorkflowSession` to `ResourceResolver`!");
        }

        AssetManager assetManager = resourceResolver.adaptTo(AssetManager.class);

        if (assetManager == null)
        {
            throw new WorkflowException("Could not adapt `ResourceResolver` to `AssetManager`!");
        }

        Resource fragmentResource = resourceResolver.getResource(payloadPath);
        String configurationSource = getConfigurationSource(processArguments);
        CFToRTFConfig config = CFToRTFConfig.parse(configurationSource);

        LOG.info("{} Applying to resource `{}`", LOG_PREFIX, payloadPath);

        LOG.debug(
                "{} Applying to resource `{}` with configuration `{}`",
                LOG_PREFIX,
                payloadPath,
                configurationSource
        );

        if (fragmentResource != null)
        {

            ContentFragment cf = fragmentResource.adaptTo(ContentFragment.class);

            if (cf != null)
            {

                StringBuilder html = CFToRTFFragmentHelper.getFragmentHtmlContents(cf);

                LOG.debug("{} Extracted HTML from CF `{}`: `{}`", LOG_PREFIX, payloadPath, configurationSource);

                String rtf = CFToRTF.transpile(html.toString(), config);
                String rtfLocation = CFToRTFAssetHelper.createRTFAsset(rtf, fragmentResource, assetManager, config);

                LOG.info("{} Successfully created RTF file `{}` from CF `{}`", LOG_PREFIX, rtfLocation, payloadPath);

            }
            else
            {
                LOG.error(
                        "{} The resource {} could not converted to a `com.adobe.cq.dam.cfm.ContentFragment` instance!",
                        LOG_PREFIX,
                        payloadPath
                );
            }

        }
        else
        {
            LOG.error("{} The content fragment resource `{}` was not found!", LOG_PREFIX, payloadPath);
        }

        completeWorkflow(workItem, workflowSession);

    }

    /**
     * Get the absolute path of target resource of this workflow
     */
    private String getPayloadPath(WorkItem workItem)
    {
        return workItem.getWorkflowData().getPayload().toString();
    }

    /**
     * Get configurations provided this workflow process
     */
    private String getConfigurationSource(MetaDataMap processArguments)
    {
        return String.valueOf(processArguments.get(CONFIG_KEY, CONFIG_TYPE));
    }

    /**
     * Advances this workflow to the next step
     */
    private void completeWorkflow(WorkItem workItem, WorkflowSession workflowSession) throws WorkflowException
    {
        workflowSession.complete(workItem, workflowSession.getRoutes(workItem, EXPAND_GROUP_MEMBERS).get(0));
    }

}
