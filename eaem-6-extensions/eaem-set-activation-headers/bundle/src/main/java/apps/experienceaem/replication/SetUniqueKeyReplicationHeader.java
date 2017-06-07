package apps.experienceaem.replication;

import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.WorkflowProcess;
import com.day.cq.workflow.metadata.MetaDataMap;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.jcr.resource.JcrResourceConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import java.util.*;

@Component(metatype = false)
@Service
@Property(name = "process.label", value = "Experience AEM Unique Key Replication Header")
public class SetUniqueKeyReplicationHeader implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(SetUniqueKeyReplicationHeader.class);

    private static String PUBLISH_AGENT_CONFIG = "/etc/replication/agents.author/publish/jcr:content";
    private static String PROTOCOL_HTTP_HEADERS = "protocolHTTPHeaders";
    private static String EAEM_UNIQUE_KEY = "eaem-unique-key: ";

    @Reference
    private ResourceResolverFactory rrFactory;

    public void execute(WorkItem workItem, WorkflowSession workflowSession, MetaDataMap args)
                            throws WorkflowException {
        try {
            Session session = workflowSession.getSession();

            Map<String, Object> authInfo = new HashMap<String, Object>();
            authInfo.put(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, session);

            Resource res = rrFactory.getResourceResolver(authInfo).getResource(PUBLISH_AGENT_CONFIG);

            if(res == null){
                log.warn("Resource - " + PUBLISH_AGENT_CONFIG + ", not available");
                return;
            }

            ValueMap vm = res.adaptTo(ValueMap.class);

            String[] headers = vm.get(PROTOCOL_HTTP_HEADERS, String[].class);

            headers = addUniqueKeyHeader(headers);

            res.adaptTo(Node.class).setProperty(PROTOCOL_HTTP_HEADERS, headers);

            session.save();
        } catch (Exception e) {
            throw new WorkflowException(e);
        }
    }

    private String[] addUniqueKeyHeader(String[] headers){
        if(ArrayUtils.isEmpty(headers)){
            headers = new String[]{
                    "Action: {action}",
                    "Path: {path}",
                    "Handle: {path}",
                    EAEM_UNIQUE_KEY + new Date().getTime()
            };

            return headers;
        }

        for(int i = 0; i < headers.length; i++){
            if(headers[i].startsWith(EAEM_UNIQUE_KEY)){
                headers[i] = EAEM_UNIQUE_KEY + new Date().getTime();
            }
        }

        return headers;
    }
}
