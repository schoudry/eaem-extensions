package apps.experienceaem.sites;

import com.adobe.granite.workflow.PayloadMap;
import com.day.cq.commons.jcr.JcrUtil;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.commons.util.DamUtil;
import com.day.cq.replication.Agent;
import com.day.cq.replication.AgentManager;
import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.PageManager;
import com.day.cq.workflow.exec.WorkflowData;
import com.day.cq.workflow.metadata.MetaDataMap;
import org.apache.commons.exec.*;
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
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.*;

@Component(
        immediate = true,
        service = {WorkflowProcess.class},
        property = {
                "process.label = Experience AEM Create PDF From page"
        }
)
public class EAEMCreatePDFFromPage implements WorkflowProcess {
    protected final Logger log = LoggerFactory.getLogger(this.getClass());

    private static String ARG_COMMAND = "COMMAND";
    private static Integer CMD_TIME_OUT = 300000; // 5 minutes
    private static SimpleDateFormat PDF_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd HH-mm-ss");
    private static String AGENT_PUBLISH = "publish";

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Reference
    private AgentManager agentMgr = null;

    @Override
    public void execute(WorkItem workItem, WorkflowSession wfSession, MetaDataMap args) throws WorkflowException {
        try {
            Session session = wfSession.getSession();
            WorkflowData wfData = workItem.getWorkflowData();

            String pagePath = null;
            String payLoadType = wfData.getPayloadType();

            if(payLoadType.equals("JCR_PATH") && wfData.getPayload() != null) {
                if(session.itemExists((String)wfData.getPayload())) {
                    pagePath = (String)wfData.getPayload();
                }
            } else if( (wfData.getPayload() != null) && payLoadType.equals("JCR_UUID")) {
                Node metaDataMap = session.getNodeByUUID((String)wfData.getPayload());
                pagePath = metaDataMap.getPath();
            }

            if(StringUtils.isEmpty(pagePath)){
                log.warn("Page path - " + wfData.getPayload() + ", does not exist");
                return;
            }

            ResourceResolver resolver = getResourceResolver(session);

            CommandLine commandLine = getCommandLine(pagePath, args, resolver);

            executeCommand(commandLine);

            session.save();
        } catch (Exception e) {
            log.error("Failed to create PDF of page", e);
        }
    }

    private CommandLine getCommandLine(String pagePath, MetaDataMap args, ResourceResolver resolver) throws Exception{
        File tmpDir = File.createTempFile("eaem", (String)null);
        tmpDir.delete();
        tmpDir.mkdir();

        File tmpFile = new File(tmpDir, resolver.getResource(pagePath).getName() + "-" + PDF_DATE_FORMAT.format(new Date()));

        String command = (String)args.get(ARG_COMMAND);

        HashMap<String, String> parameters = new HashMap<String, String>();
        parameters.put("publishPagePath", getPublishPath(pagePath));
        parameters.put("timeStampedPDFInAssets", tmpFile.getAbsolutePath());

        return CommandLine.parse(command, parameters);
    }

    private String getPublishPath(String pagePath){
        Agent publishAgent = agentMgr.getAgents().get(AGENT_PUBLISH);

        String transportURI = publishAgent.getConfiguration().getTransportURI();

        String hostName = transportURI.substring(0, transportURI.indexOf("/bin/receive"));

        return ( hostName + pagePath);
    }

    private void executeCommand(CommandLine commandLine) throws Exception{
        DefaultExecutor exec = new DefaultExecutor();
        ExecuteWatchdog watchDog = new ExecuteWatchdog(CMD_TIME_OUT);

        exec.setWatchdog(watchDog);
        exec.setStreamHandler(new PumpStreamHandler(System.out, System.err));
        exec.setProcessDestroyer(new ShutdownHookProcessDestroyer());

        int exitValue = exec.execute(commandLine);

        if(exec.isFailure(exitValue)){
            throw new RuntimeException("Error creating PDF, command returned - " + exitValue);
        }
    }

    private ResourceResolver getResourceResolver(final Session session) throws LoginException {
        return resolverFactory.getResourceResolver( Collections.<String, Object>
                singletonMap(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, session));
    }
}
