package apps.experienceaem.sites;

import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.servlets.post.JSONResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONException;
import org.apache.sling.commons.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import java.io.IOException;

@SlingServlet(
        label = "Samples - Sling All Methods Servlet",
        description = "Sample implementation of a Sling All Methods Servlet.",
        paths = { "/bin/experienceaem/sites/hello" },
        methods = { "GET", "POST" },
        extensions = { "json" }
)
public class HelloServlet extends SlingAllMethodsServlet{
    private static final Logger log = LoggerFactory.getLogger(HelloServlet.class);

    @Override
    protected final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
                                ServletException, IOException {
        try {
            addJSONHeaders(response);

            JSONObject jsonObject = new JSONObject();

            jsonObject.write(response.getWriter());
        } catch (JSONException e) {
            log.error("Could not formulate JSON response");
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected final void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
                                ServletException, IOException {
        try {
            addJSONHeaders(response);

            JSONObject jsonObject = new JSONObject();

            jsonObject.write(response.getWriter());
        } catch (JSONException e) {
            log.error("Could not formulate JSON response");
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    public static void addJSONHeaders(SlingHttpServletResponse response){
        response.setContentType(JSONResponse.RESPONSE_CONTENT_TYPE);
        response.setHeader("Cache-Control", "nocache");
        response.setCharacterEncoding("utf-8");
    }
}