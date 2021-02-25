package apps.experienceaem.assets.core.services;

import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowData;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.commons.json.JSONArray;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
        service = WorkflowProcess.class,
        property = { "process.label=Update Smart Crops Workflow Process Step" })
public class UpdateSmartCropsProcess implements WorkflowProcess {

    private static final Logger log = LoggerFactory.getLogger(UpdateSmartCropsProcess.class);

    @Reference
    private DMCService dmcService;

    public void execute(final WorkItem workItem, final WorkflowSession workflowSession, final MetaDataMap args)
                                        throws WorkflowException {
        String assetPath = getPayloadPath(workItem.getWorkflowData());

        try{
            MetaDataMap wfData = workItem.getWorkflow().getMetaDataMap();

            log.info("Updating smart crops for asset : " + assetPath);

            String smartCropsToUpdateStr = wfData.get(DMCService.SMART_CROPS_JSON, "");

            if(StringUtils.isEmpty(smartCropsToUpdateStr)){
                return;
            }

            log.info("Smart crops to update " + smartCropsToUpdateStr);

            dmcService.updateSmartCropsInS7(assetPath, new JSONArray(smartCropsToUpdateStr));
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
}
