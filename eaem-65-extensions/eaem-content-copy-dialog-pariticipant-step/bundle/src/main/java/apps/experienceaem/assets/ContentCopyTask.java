package apps.experienceaem.assets;

import com.adobe.granite.workflow.PayloadMap;
import com.day.cq.commons.jcr.JcrUtil;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.commons.util.DamUtil;
import com.day.cq.workflow.metadata.MetaDataMap;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.*;
import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.WorkflowProcess;
import org.apache.sling.jcr.resource.api.JcrResourceConstants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;

@Component(
        immediate = true,
        service = {WorkflowProcess.class},
        property = {
                "process.label = Experience AEM Content Copy Task"
        }
)
public class ContentCopyTask implements WorkflowProcess {
    protected final Logger log = LoggerFactory.getLogger(this.getClass());

    private static final String DIALOG_PARTICIPANT_NODE_ID = "node1";
    private static final String DESTINATION_PATH = "parentFolder";

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Override
    public void execute(WorkItem item, WorkflowSession wfSession, MetaDataMap args) throws WorkflowException {
        try {
            Session session = wfSession.getSession();
            ResourceResolver resolver = getResourceResolver(session);

            Asset payload = getAssetFromPayload(item, resolver);

            if(payload == null){
                log.error("Empty payload, nothing to copy");
                return;
            }

            String destinationPath = getDestinationPathForCopy(item, resolver);

            if(StringUtils.isEmpty(destinationPath)){
                log.error("Destination path empty for copyign content - " + payload.getPath());
                return;
            }

            Node copiedPath = JcrUtil.copy(payload.adaptTo(Node.class), resolver.getResource(destinationPath).adaptTo(Node.class), null);

            log.debug("Copied Path - " + copiedPath);

            session.save();
        } catch (Exception e) {
            log.error("Failed to copy content", e);
        }
    }

    private String getDestinationPathForCopy(WorkItem item, ResourceResolver resolver) throws Exception{
        String wfHistoryPath = item.getWorkflow().getId() + "/history";

        Iterator<Resource> historyItr = resolver.getResource(wfHistoryPath).listChildren();
        ValueMap metaVM = null;

        Resource resource, itemResource;
        String nodeId, destinationPath = "";

        while(historyItr.hasNext()){
            resource = historyItr.next();

            itemResource = resource.getChild("workItem");

            nodeId =  itemResource.getValueMap().get("nodeId", "");

            if(!nodeId.equals(DIALOG_PARTICIPANT_NODE_ID)){
                continue;
            }

            metaVM = itemResource.getChild("metaData").getValueMap();

            destinationPath = metaVM.get(DESTINATION_PATH, "");

            break;
        }

        return destinationPath;
    }

    public Asset getAssetFromPayload(final WorkItem item, final ResourceResolver resolver) throws Exception{
        Asset asset = null;

        if (!item.getWorkflowData().getPayloadType().equals(PayloadMap.TYPE_JCR_PATH)) {
            return null;
        }

        final String path = item.getWorkflowData().getPayload().toString();
        final Resource resource = resolver.getResource(path);

        if (null != resource) {
            asset = DamUtil.resolveToAsset(resource);
        } else {
            log.error("getAssetFromPayload: asset [{}] in payload of workflow [{}] does not exist.", path,
                    item.getWorkflow().getId());
        }

        return asset;
    }

    private ResourceResolver getResourceResolver(final Session session) throws LoginException {
        return resolverFactory.getResourceResolver( Collections.<String, Object>
                    singletonMap(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, session));
    }
}
