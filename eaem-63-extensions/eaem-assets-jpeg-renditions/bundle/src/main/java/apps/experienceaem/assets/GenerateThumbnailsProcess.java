package apps.experienceaem.assets;

import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowData;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import java.util.Arrays;
import java.util.List;

@Component
@Service({com.adobe.granite.workflow.exec.WorkflowProcess.class})
@Properties({@Property(name = "process.label", value = "Experience AEM - Generate Renditions in JPEG")})
public class GenerateThumbnailsProcess implements WorkflowProcess {
    protected final Logger log = LoggerFactory.getLogger(this.getClass());

    @Reference
    private RenditionsService renditionsService;

    public void execute(WorkItem workItem, WorkflowSession workflowSession, MetaDataMap metaDataMap)
            throws WorkflowException {
        try {
            ResourceResolver resourceResolver = workflowSession.adaptTo(ResourceResolver.class);

            String path = getPayloadPath(workItem.getWorkflowData());

            if (StringUtils.isEmpty(path)) {
                throw new WorkflowException("Failed to get asset path from payload");
            }

            List<String> processArgs = Arrays.asList(metaDataMap.get("PROCESS_ARGS", "").split(","));

            if(processArgs.size() < 2){
                throw new WorkflowException("Specify the width and height in process arguments eg. width=400,height=400");
            }

            Integer width = NumberUtils.createInteger(processArgs.get(0).substring(processArgs.get(0).indexOf("=") + 1));
            Integer height = NumberUtils.createInteger(processArgs.get(1).substring(processArgs.get(1).indexOf("=") + 1));

            Session session = workflowSession.adaptTo(Session.class);
            Resource resource = resourceResolver.getResource(path);

            renditionsService.generateJpegRenditions(resource, width, height);

            session.save();
        } catch (Exception e) {
            log.error("Error executing generate thumbnail process", e);
        }
    }

    protected String getPayloadPath(WorkflowData wfData) {
        String payloadPath = null;

        if (wfData.getPayloadType().equals("JCR_PATH")) {
            payloadPath = (String)wfData.getPayload();
        }

        return payloadPath;
    }
}
