package apps.experienceaem.core.workflows;

import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
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

    @Override
    public void execute(WorkItem workItem, WorkflowSession workflowSession, MetaDataMap processArguments)
        throws WorkflowException {
        String rtfLocation = (String)workItem.getWorkflowData().getMetaDataMap().get(EAEMContentFragmentToRTF.CF_RTF_LOCATION);

        LOG.info("RTF File path passed from previous step {}", rtfLocation);
    }
}
