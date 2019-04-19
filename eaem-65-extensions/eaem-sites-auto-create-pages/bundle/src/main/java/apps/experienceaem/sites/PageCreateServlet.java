package apps.experienceaem.sites;

import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.PageManager;
import com.day.text.Text;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.servlets.post.JSONResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.json.JSONObject;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(
        immediate = true,
        service = Servlet.class,
        property = {
            "sling.servlet.selectors=eaemcreate",
            "sling.servlet.methods=GET",
            "sling.servlet.resourceTypes=sling/servlet/default"
        }
)
public class PageCreateServlet extends SlingAllMethodsServlet{
    private static final Logger log = LoggerFactory.getLogger(PageCreateServlet.class);

    private static final String SOURCE_PATH = "src";

    private void createPage(SlingHttpServletRequest request, SlingHttpServletResponse response){
        addJSONHeaders(response);

        try {
            String srcPath = request.getParameter(SOURCE_PATH);

            JSONObject returnObj = new JSONObject();

            if(StringUtils.isEmpty(srcPath)){
                returnObj.put("error", "src empty - " + getUsage());
                response.getWriter().print(returnObj);
                return;
            }

            PageManager pageManager = request.getResourceResolver().adaptTo(PageManager.class);
            Page srcPage = pageManager.getPage(srcPath);

            if(srcPage == null){
                returnObj.put("error", "src page does not exist - " + getUsage());
                response.getWriter().print(returnObj);
                return;
            }

            String destination = request.getRequestPathInfo().getResourcePath();

            destination = destination + "/" + "test";

            Resource dstResource = pageManager.copy(srcPage.adaptTo(Resource.class), destination, null, false, true);

            dstResource.getResourceResolver().commit();

            returnObj.put("success", "created page - " + dstResource.getPath());

            response.getWriter().print(returnObj);
        } catch (Exception e) {
            log.error("Could not create page");
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private String getUsage(){
        return "usage: curl -v -u admin:admin -X POST -F src=\"/content/experience-aem/master/one\" /content/experience-aem/generated.eaemcreate.json";
    }


    @Override
    protected final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
                                ServletException, IOException {
        createPage(request, response);
    }

    @Override
    protected final void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
                                ServletException, IOException {
        createPage(request, response);
    }

    public static void addJSONHeaders(SlingHttpServletResponse response){
        response.setContentType(JSONResponse.RESPONSE_CONTENT_TYPE);
        response.setHeader("Cache-Control", "nocache");
        response.setCharacterEncoding("utf-8");
    }
}