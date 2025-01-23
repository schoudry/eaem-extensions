package apps.experienceaem.core.workflows;

import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.JobManager;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Component(
    service = WorkflowProcess.class,
    property = {
        Constants.SERVICE_DESCRIPTION + "=Send the RTF File to Indesign Server",
        EAEMContentFragmentToRTF.COMPONENT_LABEL + "=Experience AEM : RTF File to InDesign Server"
    }
)
public class EAEMPostRequestToIDS implements WorkflowProcess {

    private static final Logger LOG = LoggerFactory.getLogger(EAEMContentFragmentToRTF.class);

    public static final String INDESIGN_SERVER_TOPIC = "com/eaem/ids";
    public static final String CONTENT_JSON = "contentJson";

    public static final String INDESIGN_SERVICE_USER = "eaem-ids-service";
    public static final Map<String, Object> INDESIGN_AUTH_INFO = Collections.singletonMap("sling.service.subservice", INDESIGN_SERVICE_USER);

    @Reference
    private JobManager jobManager;

    @Override
    public void execute(WorkItem workItem, WorkflowSession workflowSession, MetaDataMap processArguments)
        throws WorkflowException {
        String rtfLocation = (String)workItem.getWorkflowData().getMetaDataMap().get(EAEMContentFragmentToRTF.CF_RTF_LOCATION);
        ResourceResolver resourceResolver = workflowSession.adaptTo(ResourceResolver.class);

        LOG.info("RTF File path passed from previous step {}", rtfLocation);

        InputStream rtfStream = (InputStream)resourceResolver.getResource(rtfLocation).getChild("jcr:content/renditions/original/jcr:content").adaptTo(ValueMap.class).get("jcr:data");
        JsonObject contentMap = new JsonObject();
        contentMap.addProperty("path", rtfLocation);

        try{
            contentMap.addProperty("rtfText", IOUtils.toString(rtfStream, StandardCharsets.UTF_8));
        }catch(Exception e){
            LOG.error("Error reading rtf stream {}", rtfLocation, e);
        }

        HashMap<String, Object> jobProps = new HashMap<String, Object>();

        jobProps.put(CONTENT_JSON, contentMap.toString());
        jobManager.addJob(INDESIGN_SERVER_TOPIC, jobProps);
    }
}
