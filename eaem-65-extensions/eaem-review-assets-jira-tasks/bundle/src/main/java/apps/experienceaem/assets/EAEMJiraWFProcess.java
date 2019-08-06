package apps.experienceaem.assets;

import com.day.cq.commons.Externalizer;
import com.day.cq.wcm.api.Page;
import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.WorkflowData;
import com.day.cq.workflow.exec.WorkflowProcess;

import com.day.cq.workflow.metadata.MetaDataMap;
import org.apache.commons.codec.binary.Base64;
import org.apache.http.Header;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpHeaders;
import org.apache.http.message.BasicHeader;
import org.apache.sling.jcr.resource.api.JcrResourceConstants;
import org.json.JSONObject;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.config.SocketConfig;
import org.apache.http.entity.StringEntity;

import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

import javax.jcr.Node;
import javax.jcr.Session;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Component(
        immediate = true,
        service = {WorkflowProcess.class},
        property = {
                "process.label = Experience AEM JIRA Integration Workflow Step"
        }
)
@Designate(ocd = EAEMJiraWFProcess.Configuration.class)
public class EAEMJiraWFProcess implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(EAEMJiraWFProcess.class);

    private static final String JIRA_REST_API = "http://localhost:8080/rest/api/2/issue/";

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    @Reference
    private Externalizer externalizer;

    private String jiraProjectKey , jiraUserName, jiraPassword;

    @Activate
    protected void activate(EAEMJiraWFProcess.Configuration configuration) {
        jiraProjectKey = configuration.jiraProjectKey();
        jiraUserName = configuration.jiraUserName();
        jiraPassword = configuration.jiraPassword();
    }

    public void execute(WorkItem workItem, WorkflowSession wfSession, MetaDataMap mapArgs) throws WorkflowException {
        try {
            if(StringUtils.isEmpty(jiraProjectKey) || StringUtils.isEmpty(jiraPassword)
                        || StringUtils.isEmpty(jiraUserName)){
                throw new RuntimeException("Required jira details missing from configuration jiraProjectKey, jiraUserName, jiraPassword");
            }

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

            String assignee = (String)workItem.getWorkflow().getWorkflowData().getMetaDataMap().get("assignee").toString();

            ResourceResolver resolver = getResourceResolver(session);
            Resource pageResource = resolver.getResource(pagePath);

            createTicket(createTicketBody(resolver, pageResource.adaptTo(Page.class), assignee));
        } catch (Exception e) {
            log.error("Error while creating JIRA ticket", e);
        }
    }

    private String createTicketBody(ResourceResolver resolver, Page page, String user) throws Exception{
        JSONObject request = new JSONObject();
        JSONObject fields = new JSONObject();
        JSONObject project = new JSONObject();
        JSONObject issueType = new JSONObject();

        String authorLink = externalizer.externalLink(resolver, Externalizer.AUTHOR, "/editor.html" + page.getPath() + ".html");

        project.put("key", jiraProjectKey);
        issueType.put("name", "Task");

        fields.put("project", project);
        fields.put("issuetype", issueType);
        fields.put("summary", "Publish page : " + page.getTitle());
        fields.put("description", "Review Approve and Publish page : " + page.getTitle() + "\n\n" + authorLink);

        if(StringUtils.isNotEmpty(user)){
            JSONObject assignee = new JSONObject();

            assignee.put("name", user);
            fields.put("assignee", assignee);
        }

        request.put("fields", fields);

        return request.toString();
    }

    private void createTicket(String requestBody) throws Exception{
        CloseableHttpClient client = null;
        String responseBody = "";

        try {
            SocketConfig sc = SocketConfig.custom().setSoTimeout(180000).build();
            client = HttpClients.custom().setDefaultSocketConfig(sc).build();

            HttpPost post = new HttpPost(JIRA_REST_API);
            StringEntity entity = new StringEntity(requestBody, "UTF-8");

            post.addHeader("Content-Type", "application/json");
            post.setEntity(entity);
            post.setHeader(getAuthorizationHeader());

            HttpResponse response = client.execute(post);

            HttpEntity responseEntity = response.getEntity();

            responseBody = IOUtils.toString(responseEntity.getContent(), "UTF-8");

            log.debug("JIRA create ticket response - " + responseBody);
        }finally{
            if(client != null){
                client.close();
            }
        }
    }

    private Header getAuthorizationHeader(){
        String auth = jiraUserName + ":" + jiraPassword;

        byte[] encodedAuth = Base64.encodeBase64(auth.getBytes(StandardCharsets.ISO_8859_1));
        String authHeader = "Basic " + new String(encodedAuth);

        return new BasicHeader(HttpHeaders.AUTHORIZATION, authHeader);
    }

    private ResourceResolver getResourceResolver(final Session session) throws LoginException {
        return resourceResolverFactory.getResourceResolver( Collections.<String, Object>
                singletonMap(JcrResourceConstants.AUTHENTICATION_INFO_SESSION, session));
    }

    @ObjectClassDefinition(
            name = "Experience AEM JIRA Integration",
            description = "Experience AEM JIRA Integration"
    )
    public @interface Configuration {

        @AttributeDefinition(
                name = "JIRA Project key",
                description = "JIRA project key found in http://<jira server>/secure/BrowseProjects.jspa?selectedCategory=all&selectedProjectType=all",
                type = AttributeType.STRING
        )
        String jiraProjectKey() default "";

        @AttributeDefinition(
                name = "JIRA User name",
                description = "JIRA User name",
                type = AttributeType.STRING
        )
        String jiraUserName() default "";

        @AttributeDefinition(
                name = "JIRA Password",
                description = "JIRA Password",
                type = AttributeType.PASSWORD
        )
        String jiraPassword() default "";
    }
}
