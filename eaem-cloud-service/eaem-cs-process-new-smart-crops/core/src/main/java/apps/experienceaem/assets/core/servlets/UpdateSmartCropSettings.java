package apps.experienceaem.assets.core.servlets;

import apps.experienceaem.assets.core.services.DMCService;
import com.day.cq.workflow.WorkflowService;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkflowData;
import com.day.cq.workflow.model.WorkflowModel;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.api.wrappers.SlingHttpServletResponseWrapper;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONObject;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.RequestDispatcher;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.CharArrayWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;

@Component(
        name = "Experience AEM Update Smart Crop settings",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=POST",
                "sling.servlet.paths=/bin/eaem/update-smart-crops"
        }
)
public class UpdateSmartCropSettings extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(UpdateSmartCropSettings.class);

    private static String SMART_CROPS_RES = "/apps/eaem-cs-process-new-smart-crops/extensions/smart-crop-renditions/renditions.html";
    private static String CROP_DATA = "cropdata";
    private static final String UPDATE_SMART_CROPS_WF_PATH = "/var/workflow/models/disney-dynamic-media-update-smart-crops";

    @Reference
    private DMCService dmcService;

    @Reference
    private WorkflowService workflowService;

    @Override
    protected final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
            ServletException, IOException {
        try {
            String path = request.getParameter("path");

            if(StringUtils.isEmpty(path)){
                return;
            }

            RequestDispatcher dp = request.getRequestDispatcher(SMART_CROPS_RES + path);

            SlingHttpServletResponse wrapperResponse = new DefaultSlingModelResponseWrapper(response);

            dp.include(request, wrapperResponse);

            String smartCropsStr = wrapperResponse.toString();

            if(StringUtils.isEmpty(smartCropsStr)){
                return;
            }

            JSONObject smartCrops = new JSONObject(smartCropsStr);
            JSONArray smartCropsToUpdate = new JSONArray();

            Iterator smartCropKeys = smartCrops.keys();
            JSONObject smartCrop = null;

            while(smartCropKeys.hasNext()){
                smartCrop = (JSONObject)smartCrops.get(String.valueOf(smartCropKeys.next()));

                if(!smartCrop.has(CROP_DATA)){
                    continue;
                }

                JSONObject currentCrop = (JSONObject)(((JSONArray)smartCrop.get(CROP_DATA)).get(0));

                if(StringUtils.isEmpty((String)currentCrop.get("id"))){
                    continue;
                }

                smartCropsToUpdate.put(currentCrop);
            }

            ResourceResolver resolver = request.getResourceResolver();
            WorkflowSession wfSession = workflowService.getWorkflowSession(resolver.adaptTo(Session.class));

            WorkflowModel wfModel = wfSession.getModel(UPDATE_SMART_CROPS_WF_PATH);
            WorkflowData wfData = wfSession.newWorkflowData("JCR_PATH", path);
            wfData.getMetaDataMap().put(DMCService.SMART_CROPS_JSON, smartCropsToUpdate.toString());

            wfSession.startWorkflow(wfModel, wfData);

            smartCropsToUpdate.write(response.getWriter());
        } catch (Exception e) {
            log.error("Could not get the smart crop settings", e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private class DefaultSlingModelResponseWrapper extends SlingHttpServletResponseWrapper {
        private CharArrayWriter writer;

        public DefaultSlingModelResponseWrapper (final SlingHttpServletResponse response) {
            super(response);
            writer = new CharArrayWriter();
        }

        public PrintWriter getWriter() throws IOException {
            return new PrintWriter(writer);
        }

        public String toString() {
            return writer.toString();
        }
    }
}
