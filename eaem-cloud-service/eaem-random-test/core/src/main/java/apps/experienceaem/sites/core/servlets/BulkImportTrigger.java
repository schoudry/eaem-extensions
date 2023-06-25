package apps.experienceaem.sites.core.servlets;

import com.day.cq.contentsync.handler.util.RequestResponseFactory;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.engine.SlingRequestProcessor;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component(
    immediate = true,
    service = Servlet.class,
    property = {
        "sling.servlet.methods=GET",
        "sling.servlet.paths=/bin/experience-aem/bulk-import-trigger"
    }
)
public class BulkImportTrigger extends SlingSafeMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(BulkImportTrigger.class);

    @Reference
    private SlingRequestProcessor slingRequestProcessor;

    @Reference
    private RequestResponseFactory requestResponseFactory;

    private static final String IMPORT_JOB_URL = "/conf/global/settings/dam/import/";

    private String runBulkImport(final ResourceResolver resolver, String bulkImportConfigName) throws Exception{
        final Map<String, Object> requestParams = new ConcurrentHashMap<>();
        requestParams.put("operation", "run");

        String jobUrl = IMPORT_JOB_URL + bulkImportConfigName + ".importJob.json";

        final HttpServletRequest request = requestResponseFactory.createRequest("POST", jobUrl, requestParams);
        final ByteArrayOutputStream bos = new ByteArrayOutputStream();

        final HttpServletResponse response = this.requestResponseFactory.createResponse(bos);

        slingRequestProcessor.processRequest(request, response, resolver);

        return bos.toString("UTF-8");
    }


    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {
        try{
            String name = request.getParameter("name");

            String output = runBulkImport(request.getResourceResolver(), name);

            response.getWriter().println(output);
        }catch(Exception e){
            throw new ServletException("Error triggering bulk import", e);
        }
    }
}
