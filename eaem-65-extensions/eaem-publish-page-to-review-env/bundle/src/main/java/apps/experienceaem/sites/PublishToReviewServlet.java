package apps.experienceaem.sites;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.post.JSONResponse;
import org.json.JSONException;
import org.json.JSONObject;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.framework.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(
        name = "Experience AEM Overlay Creator",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=GET",
                "sling.servlet.paths=/bin/eaem/sites/review/publish"
        }
)
public class PublishToReviewServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(PublishToReviewServlet.class);

    public static final String PUBLISH_TO_REVIEW_URL = "/bin/eaem/sites/review/publish";
    public static final String STATUS_URL = "/bin/eaem/sites/review/status";

    @Override
    protected final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
            ServletException, IOException {
        try {
            addJSONHeaders(response);

            if(PUBLISH_TO_REVIEW_URL.equals(request.getRequestPathInfo().getResourcePath())){
                handlePublish(request, response);
            }else{
                handleStatus(request, response);
            }
        } catch (Exception e) {
            log.error("Error processing publish to review...");
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void handleStatus(SlingHttpServletRequest request, SlingHttpServletResponse response) throws Exception {
        JSONObject jsonObject = new JSONObject();

        String folderPath = request.getParameter("parentPath");
    }

    private void handlePublish(SlingHttpServletRequest request, SlingHttpServletResponse response) throws Exception {
        JSONObject jsonObject = new JSONObject();

        String pagePaths = request.getParameter("pagePaths");
    }

    public static void addJSONHeaders(SlingHttpServletResponse response){
        response.setContentType(JSONResponse.RESPONSE_CONTENT_TYPE);
        response.setHeader("Cache-Control", "nocache");
        response.setCharacterEncoding("utf-8");
    }
}
