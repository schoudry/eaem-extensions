package apps.mysample.verifypayload;

import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.WorkflowData;
import com.day.cq.workflow.exec.WorkflowProcess;
import com.day.cq.workflow.metadata.MetaDataMap;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;

@Component(metatype = true)
@Service
@Property(name = "process.label", value = "Verify page with pdf")
public class VerifyPayLoadStep implements WorkflowProcess {
    private final Logger logger = LoggerFactory.getLogger(VerifyPayLoadStep.class);

    @Override
    public void execute(WorkItem item, WorkflowSession wfSession, MetaDataMap args) throws WorkflowException {
        logger.info("Entered verify payload workflow with item : " + item.getId());

        WorkflowData data = item.getWorkflowData();

        if(!"JCR_PATH".equals(data.getPayloadType())){
            throw new WorkflowException("Payload type not a jcr path");
        }

        Session session = wfSession.getSession();

        /*try{
            Node node = session.getNodeByIdentifier((String)data.getPayload());
        }catch(Exception e){
            throw new WorkflowException("Error checking the payload");
        }*/

        return;
    }
}
