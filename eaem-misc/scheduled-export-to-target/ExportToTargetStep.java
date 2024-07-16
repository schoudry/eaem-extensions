package com.adobe.aem.workflow;

import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowData;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.contentsync.handler.util.RequestResponseFactory;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.engine.SlingRequestProcessor;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

@Component(
    service = WorkflowProcess.class,
    property = {"process.label=Experience AEM - XF Export to Target"
    }
)

public class ExportToTargetStep implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(ExportToTargetStep.class);

    private String EXPORT_TO_TARGET_URL = "/libs/cq/experience-fragments/content/commons/targetexporter.html";
    private String PATH_PAYLOAD_PARAM = "path";

    @Reference
    private RequestResponseFactory requestResponseFactory;

    @Reference
    private SlingRequestProcessor slingRequestProcessor;

    public void execute(final WorkItem workItem, final WorkflowSession workflowSession, final MetaDataMap args)
        throws WorkflowException {
        String xfPath = getPayloadPath(workItem.getWorkflowData());

        try {
            ResourceResolver resolver = workflowSession.adaptTo(ResourceResolver.class);

            log.info("Exporting XF path {} ", xfPath);

            Map<String, Object> requestParams = new HashMap<String, Object>();
            requestParams.put(PATH_PAYLOAD_PARAM, xfPath);

            HttpServletRequest request = requestResponseFactory.createRequest("POST", EXPORT_TO_TARGET_URL, requestParams);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();

            HttpServletResponse response = this.requestResponseFactory.createResponse(bos);

            slingRequestProcessor.processRequest(request, response, resolver);

            log.info("Exporting XF path - {}, response - {}", xfPath, bos.toString("UTF-8"));
        } catch (Exception e) {
            log.error("Error occured while exporting to Target - " + xfPath, e);
        }
    }

    private String getPayloadPath(WorkflowData wfData) {
        String payloadPath = null;

        if (wfData.getPayloadType().equals("JCR_PATH")) {
            payloadPath = (String) wfData.getPayload();
        }

        return payloadPath;
    }
}
