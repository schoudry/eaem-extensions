package apps.experienceaem.assets.core.listeners;

import apps.experienceaem.assets.core.services.IDSService;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.commons.lang.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import java.util.HashMap;
import java.util.Map;

import static apps.experienceaem.assets.core.util.Constants.*;

@Component(
        immediate = true,
        service = JobConsumer.class,
        property = {
                "job.topics=" + INDESIGN_SERVER_TOPIC,
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

        String indesignTemplatePath = (String)job.getProperty(INDESIGN_TEMPLATE_PATH);

        try {
            resolver = resolverFactory.getServiceResourceResolver(INDESIGN_AUTH_INFO);

            String exportStructure = (String)job.getProperty(EXPORT_STRUCTURE);

            if(StringUtils.isNotEmpty(exportStructure)){
                return executeStructureExport(indesignTemplatePath, resolver);
            }else{
                return executePDFExport(job, resolver);
            }
        } catch (Exception e) {
            logger.error("Failed to process indesign server job for asset {} ", indesignTemplatePath, e);
            return JobResult.FAILED;
        } finally {
            if(resolver != null){
                resolver.close();
            }
        }
    }

    private String[] getIDSScriptForStructure(){
        return new String[] { "/libs/settings/dam/indesign/scripts/json2.jsx/jcr:content",
                "/libs/settings/dam/indesign/scripts/cq-lib.jsx/jcr:content",
                "/apps/eaem-assets-ids-connector/indesign/scripts/export-structure.jsx/jcr:content"};
    }

    private JobResult executeStructureExport(String indesignTemplatePath, ResourceResolver resolver )
                            throws Exception{
        Resource indesignRes = resolver.getResource(indesignTemplatePath);

        if(indesignRes == null){
            logger.error("File not found {} ", indesignTemplatePath);
            return JobResult.FAILED;
        }

        Map<String, String> scriptArs = new HashMap<String, String>();
        scriptArs.put("resourcePath", indesignTemplatePath);

        String payload = idsService.buildSOAPPayload(resolver, scriptArs, indesignRes, getIDSScriptForStructure());

        JsonObject responseObj = idsService.executeInDesignServerRequest(resolver, payload);

        JsonElement structureJSON = responseObj.get("structure");

        if(structureJSON == null){
            JsonElement indesignError = responseObj.get("error");

            logger.error("Indesign server job resulted in error for asset {} {} ", indesignTemplatePath, indesignError);

            return JobResult.FAILED;
        }

        Resource metadataRes = indesignRes.getChild("jcr:content/metadata");

        metadataRes.adaptTo(Node.class).setProperty(STRUCTURE_JSON, structureJSON.toString());

        resolver.commit();

        return JobResult.OK;
    }

    private JobResult executePDFExport(Job job, ResourceResolver resolver) throws Exception{
        String indesignTemplatePath = (String)job.getProperty(INDESIGN_TEMPLATE_PATH);
        Resource indesignRes = resolver.getResource(indesignTemplatePath);

        String jobReportPath = (String)job.getProperty(JOB_PATH);
        Resource jobReportRes = resolver.getResource(jobReportPath);
        Node jobReportNode = jobReportRes.adaptTo(Node.class);

        if(indesignRes == null){
            logger.error("File not found {} ", indesignTemplatePath);
            jobReportNode.setProperty("jobStatus", "File not found : " + indesignTemplatePath);

            resolver.commit();
            return JobResult.FAILED;
        }

        Map<String, String> scriptArs = new HashMap<String, String>();
        scriptArs.put("resourcePath", indesignTemplatePath);
        scriptArs.put("aemUploadPath", jobReportNode.getPath());
        scriptArs.put(CONTENT_JSON, (String)job.getProperty(CONTENT_JSON));

        String payload = idsService.buildSOAPPayload(resolver, scriptArs, indesignRes, null);

        JsonObject responseObj = idsService.executeInDesignServerRequest(resolver, payload);

        JsonElement indesignSuccess = responseObj.get("success");

        if(indesignSuccess == null){
            JsonElement indesignError = responseObj.get("error");

            if(indesignError != null){
                logger.error("Indesign server job resulted in error for asset {} {} ", indesignTemplatePath, indesignError.toString());
                jobReportNode.setProperty("jobStatus", indesignError.toString());
            }else{
                jobReportNode.setProperty("jobStatus", "Error processing document, check indesign console log");
            }

            resolver.commit();

            return JobResult.FAILED;
        }

        resolver.commit();

        //idsService.uploadToS3(jobReportRes.getChildren().iterator().next());

        jobReportNode.setProperty("jobStatus",JOB_STATUS_SUCCESS);

        resolver.commit();

        return JobResult.OK;
    }
}
