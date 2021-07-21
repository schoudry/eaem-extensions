package apps.experienceaem.assets.core.servlets;

import com.day.cq.commons.TidyJSONWriter;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.JobManager;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.*;

@Component(
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.selectors=eaemcfreport",
                "sling.servlet.methods=POST",
                "sling.servlet.resourceTypes=sling/servlet/default"
        }
)
public class EAEMReportGeneration extends SlingAllMethodsServlet {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Reference
    private JobManager jobManager;

    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        ResourceResolver resourceResolver = request.getResourceResolver();

        try{
            String jobNodeName = UUID.randomUUID().toString();

            HashMap<String, Object> jobProps = new HashMap<String, Object>();
            jobProps.put("cfRootPath", request.getParameter("cfRootPath"));
            jobProps.put("pageRootPath", request.getParameter("pageRootPath"));
            jobProps.put("jobNodePath", "/var/dam/reports/" + jobNodeName);

            List<String> columns = new ArrayList<String>();
            columns.addAll(Arrays.asList(request.getParameterValues("column")));
            columns.add("Page References");

            jobProps.put("reportColumns", columns.toArray(new String[0]));

            Node jobNode = createJobNode(resourceResolver, jobNodeName, request, columns);
            Calendar createTime = Calendar.getInstance();
            createTime.setTimeInMillis(createTime.getTimeInMillis());

            Job job = jobManager.addJob("com/eaem/aem/dam/report", jobProps);

            jobNode.setProperty("jobId", job.getId());
            jobNode.setProperty("jobStatus", "processing");
            jobNode.setProperty("jcr:created", createTime);

            TidyJSONWriter writer = new TidyJSONWriter(response.getWriter());
            writer.object();
            writer.key("jobNodeName").value(jobNodeName);
            writer.endObject();

            resourceResolver.commit();
        }catch(Exception e){
            logger.error("Error scheduling export job", e);
        }
    }

    private Node createJobNode(ResourceResolver resourceResolver, String jobNodeName,
                               SlingHttpServletRequest request, List<String> columns)
                        throws RepositoryException {
        Session session = resourceResolver.adaptTo(Session.class);
        String baseNodePath = "/var/dam/reports";
        Node baseNode, jobNode;

        if(resourceResolver.getResource(baseNodePath) == null) {
            jobNode = session.getNode("/var/dam");
            baseNode = jobNode.addNode("reports", "sling:Folder");
        } else {
            baseNode = session.getNode(baseNodePath);
        }

        jobNode = baseNode.addNode(jobNodeName.replaceAll("/", "-"), "nt:unstructured");
        jobNode.setProperty("reportType", request.getParameter("dam-asset-report-type"));
        jobNode.setProperty("cfRootPath", request.getParameter("cfRootPath"));
        jobNode.setProperty("pageRootPath", request.getParameter("pageRootPath"));
        jobNode.setProperty("jobTitle", request.getParameter("jobTitle"));
        jobNode.setProperty("jobDescription", request.getParameter("jobDescription"));
        jobNode.setProperty("reportColumns", columns.toArray(new String[0]));

        session.save();

        return jobNode;
    }
}
