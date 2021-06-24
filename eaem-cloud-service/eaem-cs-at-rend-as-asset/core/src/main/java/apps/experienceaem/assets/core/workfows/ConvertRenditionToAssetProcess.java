package apps.experienceaem.assets.core.workfows;

import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowData;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
        service = WorkflowProcess.class,
        property = { "process.label=Experience AEM Convert Rendition to Asset, Workflow Process Step" }
)
public class ConvertRenditionToAssetProcess implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(ConvertRenditionToAssetProcess.class);

    public void execute(final WorkItem workItem, final WorkflowSession workflowSession, final MetaDataMap args)
            throws WorkflowException {
        String assetPath = getPayloadPath(workItem.getWorkflowData());

        try{
            MetaDataMap wfData = workItem.getWorkflow().getMetaDataMap();

            log.info("Converting Rendition to Asset for : " + assetPath);
        }catch(Exception e){
            log.error("Error occured while converting rendtion to asset for payload - " + assetPath, e);
        }
    }

    private String getPayloadPath(WorkflowData wfData) {
        String payloadPath = null;

        if (wfData.getPayloadType().equals("JCR_PATH")) {
            payloadPath = (String)wfData.getPayload();
        }

        return payloadPath;
    }

}
