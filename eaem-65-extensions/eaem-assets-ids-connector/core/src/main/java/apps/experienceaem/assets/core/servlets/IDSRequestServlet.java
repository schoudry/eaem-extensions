package apps.experienceaem.assets.core.servlets;

import com.adobe.cq.dam.cfm.ContentElement;
import com.adobe.cq.dam.cfm.ContentFragment;
import com.adobe.cq.dam.cfm.FragmentData;
import com.adobe.xfa.ut.StringUtils;
import com.day.cq.commons.TidyJSONWriter;
import com.day.cq.commons.jcr.JcrUtil;
import com.google.gson.JsonObject;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
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

import javax.jcr.Node;
import javax.jcr.Session;
import javax.servlet.Servlet;
import java.text.SimpleDateFormat;
import java.util.*;

import static apps.experienceaem.assets.core.util.Constants.*;

@Component(
        immediate = true,
        service = Servlet.class,
        property = {
                Constants.SERVICE_DESCRIPTION + "=GCOM InDesign Server Process Servlet",
                "sling.servlet.methods=" + HttpConstants.METHOD_GET,
                "sling.servlet.methods=" + HttpConstants.METHOD_POST,
                "sling.servlet.resourceTypes=sling/servlet/default",
                "sling.servlet.extensions=" + "idspdf"
        }
)
public class IDSRequestServlet extends SlingAllMethodsServlet {
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

            ResourceResolver resolver = resolverFactory.getServiceResourceResolver(INDESIGN_AUTH_INFO);
            Session session = resolver.adaptTo(Session.class);

            Node jobNode = createJobNode(resolver, resource.getPath());

            HashMap<String, Object> jobProps = new HashMap<String, Object>();
            jobProps.put(INDESIGN_TEMPLATE_PATH, resource.getPath());
            jobProps.put(JOB_PATH, jobNode.getPath());
            jobProps.put(CONTENT_JSON, getStructuredContentAsJsonString(req, resolver));

            Job job = jobManager.addJob(INDESIGN_SERVER_TOPIC, jobProps);

            jobNode.setProperty("jobId", job.getId());

            session.save();

            writer.key("success").value(jobNode.getPath());
            writer.endObject();
        } catch (Exception e) {
            logger.error("Error scheduling indesign server job for asset : ", resource.getPath());
        }
    }

    @Override
    protected void doPost(final SlingHttpServletRequest req, final SlingHttpServletResponse resp) {
        doGet(req, resp);
    }

    private String getStructuredContentAsJsonString(SlingHttpServletRequest req, ResourceResolver resolver) {
        JsonObject contentMap = new JsonObject();
        JsonObject valueJson = null;

        boolean preview = false;

        if(!StringUtils.isEmpty(req.getParameter(PARAM_PREVIEW))){
            preview = Boolean.valueOf(req.getParameter(PARAM_PREVIEW));
        }

        int index = 1;
        String paramPath, paramType, paramValue;

        do {
            paramPath = req.getParameter(PARAM_PREFIX + index + PARAM_PATH);

            if (StringUtils.isEmpty(paramPath)) {
                break;
            }

            paramPath = paramPath.substring(paramPath.lastIndexOf("/") + 1);

            valueJson = new JsonObject();

            paramType = req.getParameter(PARAM_PREFIX + index + PARAM_TYPE);

            paramType = !StringUtils.isEmpty(paramType) ? paramType : RAW_TEXT;

            paramValue = req.getParameter(PARAM_PREFIX + index + PARAM_VALUE);

            if(paramType.equals(CF_PATH)){
                addValuesFromCF(resolver, contentMap, paramPath, paramValue);
            }else{
                valueJson.addProperty("type", paramType);
                paramValue = !StringUtils.isEmpty(paramValue) ? paramValue : "";

                if(paramType.equals(JCR_PATH) && preview){
                    paramValue = paramValue + PREVIEW_RENDITION;
                }

                valueJson.addProperty("value", paramValue);
                contentMap.add(paramPath, valueJson);
            }

            index = index + 1;
        } while (true);

        return contentMap.toString();
    }

    private void addValuesFromCF(ResourceResolver resolver, JsonObject contentMap, String idPathPrefix, String cfPath){
        Resource cfResource = resolver.getResource(cfPath);

        if(cfResource == null){
            return;
        }

        JsonObject valueJson = null; String value = null;
        ContentFragment cf = cfResource.adaptTo(ContentFragment.class);

        Iterator<ContentElement> cfElementsItr = cf.getElements();

        while(cfElementsItr.hasNext()) {
            ContentElement cfElement = cfElementsItr.next();

            if (cfElement == null) {
                continue;
            }

            FragmentData fragValue = getVariationValue(cfElement, MASTER_VARIATION);

            if(fragValue == null){
                continue;
            }

            valueJson = new JsonObject();

            value = String.valueOf(fragValue.getValue()).trim();

            if(value.startsWith("/")){
                valueJson.addProperty("type", JCR_PATH);
            }else{
                valueJson.addProperty("type", RAW_TEXT);
            }

            valueJson.addProperty("value", removeUnnecessaryChars(value));

            contentMap.add(idPathPrefix + "_" + cfElement.getName(), valueJson);
        }
    }

    private String removeUnnecessaryChars(String value){
        if(StringUtils.isEmpty(value) || value.equals("null")){
            return "";
        }

        if(value.startsWith(P_TAG)){
            value = value.substring(P_TAG.length(), value.lastIndexOf(P_END_TAG));
        }

        return value;
    }

    private FragmentData getVariationValue(ContentElement cfElement, String variation){
        if(StringUtils.isEmpty(variation) || "master".equals(variation)){
            return cfElement.getValue();
        }

        return cfElement.getVariation(variation).getValue();
    }

    private Node createJobNode(ResourceResolver resolver, String indesignTemplatePath) throws Exception {
        Resource reportRes = resolver.getResource(INDESIGN_GEN_REPORTS_PATH);
        Node reportNode = null;

        if (reportRes == null) {
            JcrUtil.createPath(INDESIGN_GEN_REPORTS_PATH, "sling:Folder", "sling:Folder", resolver.adaptTo(Session.class), false);
        }

        reportNode = JcrUtil.createPath(INDESIGN_GEN_REPORTS_PATH + "/" + FOLDER_FORMAT.format(new Date()),
                "sling:Folder", "sling:Folder", resolver.adaptTo(Session.class), true);

        Calendar createTime = Calendar.getInstance();
        createTime.setTimeInMillis(createTime.getTimeInMillis());

        String jobNodeName = UUID.randomUUID().toString();
        Node jobNode = reportNode.addNode(jobNodeName.replaceAll("/", "-"), "nt:unstructured");

        jobNode.setProperty(INDESIGN_TEMPLATE_PATH, indesignTemplatePath);
        jobNode.setProperty("jobStatus", JOB_STATUS_PROCESSING);
        jobNode.setProperty("jcr:created", createTime);

        return jobNode;
    }
}
