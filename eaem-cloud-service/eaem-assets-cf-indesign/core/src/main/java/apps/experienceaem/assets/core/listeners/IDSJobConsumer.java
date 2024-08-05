package apps.experienceaem.assets.core.listeners;

import apps.experienceaem.assets.core.services.IDSService;
import apps.experienceaem.assets.core.servlets.IDSRequestServlet;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Component(
        immediate = true,
        service = JobConsumer.class,
        property = {
                "job.topics=" + IDSRequestServlet.INDESIGN_SERVER_TOPIC,
        }
)
public class IDSJobConsumer implements JobConsumer {
    protected final Logger logger = LoggerFactory.getLogger(IDSJobConsumer.class);

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Reference
    private IDSService idsService;

    public JobResult process(Job job) {
        ResourceResolver resolver = null;

        try {
            resolver = resolverFactory.getServiceResourceResolver(IDSRequestServlet.INDESIGN_AUTH_INFO);

            return executeCreateInDesignDoc(job, resolver);
        } catch (Exception e) {
            logger.error("Failed to process indesign server job", e);
            return JobResult.FAILED;
        } finally {
            if(resolver != null){
                resolver.close();
            }
        }
    }

    private JobResult executeCreateInDesignDoc(Job job, ResourceResolver resolver) throws Exception{
        Map<String, String> scriptArs = new HashMap<String, String>();
        scriptArs.put(IDSRequestServlet.CONTENT_JSON, (String)job.getProperty(IDSRequestServlet.CONTENT_JSON));

        String payload = idsService.buildSOAPPayload(resolver, scriptArs, null);

        JsonObject responseObj = idsService.executeInDesignServerRequest(resolver, payload);

        JsonElement indesignSuccess = responseObj.get("success");

        if(indesignSuccess == null){
            JsonElement indesignError = responseObj.get("error");

            if(indesignError != null){
                logger.error("Indesign server job resulted in error {} ", indesignError.toString());
            }

            resolver.commit();

            return JobResult.FAILED;
        }

        resolver.commit();

        return JobResult.OK;
    }
}
