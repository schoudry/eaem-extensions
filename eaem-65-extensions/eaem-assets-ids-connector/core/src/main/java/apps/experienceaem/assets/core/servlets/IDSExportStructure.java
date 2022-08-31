package apps.experienceaem.assets.core.servlets;

import com.day.cq.commons.TidyJSONWriter;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.JobManager;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import java.text.SimpleDateFormat;
import java.util.HashMap;

import static apps.experienceaem.assets.core.util.Constants.*;

@Component(
        immediate = true,
        service = Servlet.class,
        property = {
                Constants.SERVICE_DESCRIPTION + "=GCOM InDesign Server Get Structure Servlet",
                "sling.servlet.methods=" + HttpConstants.METHOD_GET,
                "sling.servlet.resourceTypes=sling/servlet/default",
                "sling.servlet.extensions=" + "getDocStructure"
        }
)
public class IDSExportStructure extends SlingAllMethodsServlet {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final SimpleDateFormat FOLDER_FORMAT = new SimpleDateFormat("yyyy-MM-dd");

    @Reference
    private JobManager jobManager;

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Override
    protected void doGet(final SlingHttpServletRequest req, final SlingHttpServletResponse resp) {
        resp.setContentType("application/json");

        final Resource resource = req.getResource();

        try {
            TidyJSONWriter writer = new TidyJSONWriter(resp.getWriter());
            writer.object();

            if (resource == null) {
                writer.key("error").value("No resource found");
                writer.endObject();
            }

            HashMap<String, Object> jobProps = new HashMap<String, Object>();
            jobProps.put(INDESIGN_TEMPLATE_PATH, resource.getPath());
            jobProps.put(EXPORT_STRUCTURE, EXPORT_STRUCTURE);

            Job job = jobManager.addJob(INDESIGN_SERVER_TOPIC, jobProps);

            writer.key("success").value(job.getId());
            writer.endObject();
        } catch (Exception e) {
            logger.error("Error scheduling indesign server job for asset : ", resource.getPath());
        }
    }
}
