package apps.experienceaem.sites.core.acls;

import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowData;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.replication.*;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import java.util.HashMap;
import java.util.Map;

@Component(
        service = WorkflowProcess.class,
        property = { "process.label=Experience AEM Embargo Replicate to Preview Process Step" })
public class EmbargoReplicationToPreview implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(EmbargoReplicationToPreview.class.getName());

    private static final String PREVIEW_AGENT = "publish";

    @Reference
    ResourceResolverFactory resourceResolverFactory;

    @Reference
    Replicator replicator;

    public void execute(final WorkItem workItem, final WorkflowSession workflowSession, final MetaDataMap args)
            throws WorkflowException {
        String pagePath = getPayloadPath(workItem.getWorkflowData());

        try{
            ResourceResolver serviceResolver = getEmbargoServiceResolver();

            ReplicationOptions options = new ReplicationOptions();

            options.setFilter(new AgentFilter() {
                @Override
                public boolean isIncluded(Agent agent) {
                    return agent.getId().equals(PREVIEW_AGENT);
                }
            });

            replicator.replicate(serviceResolver.adaptTo(Session.class), ReplicationActionType.ACTIVATE, pagePath, options);

            ReplicationStatus repStatus = serviceResolver.getResource(pagePath).adaptTo(ReplicationStatus.class);

            ReplicationStatus previewStatus = repStatus.getStatusForAgent(PREVIEW_AGENT);

            log.info("Page Replication status of {} is {} done by {} ", pagePath,
                            previewStatus.getLastReplicationAction().getName(), previewStatus.getLastPublishedBy());
        }catch(Exception e){
            log.error("Error while publish to preview {} ", pagePath, e);
        }
    }

    private String getPayloadPath(WorkflowData wfData) {
        String payloadPath = null;

        if (wfData.getPayloadType().equals("JCR_PATH")) {
            payloadPath = (String)wfData.getPayload();
        }

        return payloadPath;
    }

    private ResourceResolver getEmbargoServiceResolver() throws Exception{
        Map<String, Object> SERVICE_MAP = new HashMap<>();
        SERVICE_MAP.put(ResourceResolverFactory.SUBSERVICE, "eaem-embargo-service");

        return resourceResolverFactory.getServiceResourceResolver(SERVICE_MAP);
    }
}
