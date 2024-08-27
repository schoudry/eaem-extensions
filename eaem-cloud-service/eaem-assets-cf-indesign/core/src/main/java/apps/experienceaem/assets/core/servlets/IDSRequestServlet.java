package apps.experienceaem.assets.core.servlets;

import com.adobe.cq.dam.cfm.ContentElement;
import com.adobe.cq.dam.cfm.ContentFragment;
import com.adobe.cq.dam.cfm.FragmentData;
import com.day.cq.commons.TidyJSONWriter;
import com.google.gson.JsonObject;
import org.apache.commons.lang.StringUtils;
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
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@Component(
    immediate = true,
    service = Servlet.class,
    property = {
        Constants.SERVICE_DESCRIPTION + "=Experience AEM InDesign Server Process Servlet",
        "sling.servlet.methods=" + HttpConstants.METHOD_GET,
        "sling.servlet.methods=" + HttpConstants.METHOD_POST,
        "sling.servlet.resourceTypes=sling/servlet/default",
        "sling.servlet.extensions=" + "createInDesignDoc"
    }
)
public class IDSRequestServlet extends SlingAllMethodsServlet {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    public static final String INDESIGN_SERVICE_USER = "eaem-ids-service";
    public static final String JOB_PATH = "jobPath";
    public static final String CONTENT_JSON = "contentJson";
    public static final String INDESIGN_SERVER_TOPIC = "com/eaem/ids";
    public static final String MASTER_VARIATION = "master";
    public static final String ELE_NAME_PARAM = "eleName";
    public static final String P_TAG = "<p>";
    public static final String P_END_TAG = "</p>";

    public static final Map<String, Object> INDESIGN_AUTH_INFO = Collections.singletonMap("sling.service.subservice", INDESIGN_SERVICE_USER);

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

            String eleName = req.getParameter(ELE_NAME_PARAM);

            ResourceResolver resolver = resolverFactory.getServiceResourceResolver(INDESIGN_AUTH_INFO);
            Session session = resolver.adaptTo(Session.class);

            HashMap<String, Object> jobProps = new HashMap<String, Object>();
            String cfPath = req.getRequestPathInfo().getResourcePath();
            String valuesJSON = getValuesFromCFAsJSON(resolver, cfPath, eleName);

            if(StringUtils.isEmpty(valuesJSON)){
                writer.key("error").value("No content fragment - " + cfPath);
                writer.endObject();
                return;
            }

            jobProps.put(CONTENT_JSON, valuesJSON);

            Job job = jobManager.addJob(INDESIGN_SERVER_TOPIC, jobProps);

            session.save();

            writer.key("success").value(job.getId());
            writer.endObject();
        } catch (Exception e) {
            logger.error("Error scheduling indesign server job for asset : ", resource.getPath());
        }
    }

    private String getValuesFromCFAsJSON(ResourceResolver resolver, String cfPath, String eleName){
        Resource cfResource = resolver.getResource(cfPath);

        if(cfResource == null){
            return "";
        }

        String value = null;
        JsonObject contentMap = new JsonObject();
        ContentFragment cf = cfResource.adaptTo(ContentFragment.class);

        Iterator<ContentElement> cfElementsItr = cf.getElements();

        while(cfElementsItr.hasNext()) {
            ContentElement cfElement = cfElementsItr.next();

            if (cfElement == null) {
                continue;
            }

            if(!StringUtils.isEmpty(eleName) && !eleName.equalsIgnoreCase(cfElement.getName())){
                continue;
            }

            FragmentData fragValue = getVariationValue(cfElement, MASTER_VARIATION);

            if(fragValue == null){
                continue;
            }

            value = String.valueOf(fragValue.getValue()).trim();

            contentMap.addProperty(cfElement.getName(), removeUnnecessaryChars(value));
        }

        contentMap.addProperty("path", cfPath);

        return contentMap.toString();
    }

    private FragmentData getVariationValue(ContentElement cfElement, String variation){
        if(StringUtils.isEmpty(variation) || "master".equals(variation)){
            return cfElement.getValue();
        }

        return cfElement.getVariation(variation).getValue();
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

    @Override
    protected void doPost(final SlingHttpServletRequest req, final SlingHttpServletResponse resp) {
        doGet(req, resp);
    }
}
