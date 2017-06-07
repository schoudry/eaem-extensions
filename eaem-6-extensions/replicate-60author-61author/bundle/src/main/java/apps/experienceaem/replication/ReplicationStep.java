package apps.experienceaem.replication;

import com.day.cq.dam.api.Asset;
import com.day.cq.dam.commons.process.AbstractAssetWorkflowProcess;
import com.day.cq.replication.*;
import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.metadata.MetaDataMap;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import java.util.ArrayList;
import java.util.List;

@Component
@Service
@Properties({@Property(name = "process.label", value = "Replicate Assets to 61 Author")})
public class ReplicationStep extends AbstractAssetWorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(ReplicationStep.class);

    // the agent used for replication
    private static final String REP_AGENT_61 = "61_author";

    @Reference
    Replicator replicator;

    @Reference
    private AgentManager agentMgr = null;

    @Reference
    ResourceResolverFactory resourceResolverFactory;

    @Override
    public void execute(WorkItem workItem, WorkflowSession workflowSession, MetaDataMap args)
            throws WorkflowException {
        try{
            if(!agentExists()){
                log.info("NO Replication agent " + REP_AGENT_61 + ", skipping replicating to 61");
                return;
            }

            Session session = workflowSession.getSession();
            Asset asset = getAssetFromPayload(workItem, session);

            List<String> paths = new ArrayList<String>();

            //add the file path to replication queue
            paths.add(asset.getPath());

            doReplicate(paths, session);
        }catch(Exception e){
            throw new WorkflowException("Error replicating to 61 Author", e);
        }
    }

    private boolean agentExists(){
        return agentMgr.getAgents().containsKey(REP_AGENT_61);
    }

    private void doReplicate(List<String> paths, Session session) throws Exception{
        ReplicationOptions opts = new ReplicationOptions();

        //use the 61 replication agent
        opts.setFilter(new AgentFilter() {
            public boolean isIncluded(com.day.cq.replication.Agent agent) {
                return agent.getId().equalsIgnoreCase(REP_AGENT_61);
            }
        });

        for(String path : paths){
            replicator.replicate(session, ReplicationActionType.ACTIVATE, path, opts);
        }
    }

    public ResourceResolver getResourceResolver(final Session session) {
        ResourceResolver resourceResolver = null;

        try {
            resourceResolver = resourceResolverFactory.getAdministrativeResourceResolver(null);
        } catch (LoginException e) {
            log.error("Error obtaining the resourceresolver",e);
        }

        return resourceResolver;
    }
}

