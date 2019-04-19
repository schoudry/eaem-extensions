package apps.experienceaem.sites;

import com.day.cq.commons.jcr.JcrUtil;
import com.day.cq.dam.api.AssetManager;
import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.PageManager;
import com.day.text.Text;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.commons.JcrUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.commons.mime.MimeTypeService;
import org.apache.sling.servlets.post.JSONResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.json.JSONException;
import org.json.JSONObject;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Iterator;

@Component(
        immediate = true,
        service = Servlet.class,
        property = {
            "sling.servlet.selectors=eaemcreate",
            "sling.servlet.methods=POST",
            "sling.servlet.resourceTypes=sling/servlet/default"
        }
)
public class PageCreateServlet extends SlingAllMethodsServlet{
    private static final Logger log = LoggerFactory.getLogger(PageCreateServlet.class);

    private static final String SOURCE_PATH = "src";

    @Reference
    protected MimeTypeService mimeTypeService;

    private void createPage(SlingHttpServletRequest request, SlingHttpServletResponse response){
        addJSONHeaders(response);

        try {
            String srcPath = request.getParameter(SOURCE_PATH);

            if(StringUtils.isEmpty(srcPath)){
                writeError(response, "src empty - " + getUsage());
                return;
            }

            String jsonFileStr = request.getParameter("file");

            if(StringUtils.isEmpty(jsonFileStr)){
                writeError(response, "upload json file with page data - " + getUsage());
                return;
            }

            ResourceResolver resolver = request.getResourceResolver();

            PageManager pageManager = resolver.adaptTo(PageManager.class);

            if(pageManager == null){
                writeError(response, "pageManager not available");
                return;
            }

            Page srcPage = pageManager.getPage(srcPath);

            if(srcPage == null){
                writeError(response, "src page not available - " + getUsage());
                return;
            }

            JSONObject pageData = new JSONObject(jsonFileStr);

            String destination = request.getRequestPathInfo().getResourcePath();

            destination = destination + "/" + getPageName(pageData);

            addImageInDam(pageData, resolver);

            if(resolver.getResource(destination) != null){
                writeError(response, "page already exists - " + destination);
                return;
            }

            Resource dstResource = pageManager.copy(srcPage.adaptTo(Resource.class), destination, null, false, true);

            Iterator<String> pageDataItr = pageData.keys();
            String path, data, property;

            Resource child = null;
            Node node = null;

            while(pageDataItr.hasNext()){
                path = pageDataItr.next();

                if(path.equals("image")){
                    continue;
                }

                data = pageData.getString(path);

                property = null;

                if(path.contains("@")){
                    property = path.substring(path.indexOf("@") + 1);
                    path = path.substring(0, path.indexOf("@"));
                }

                child = dstResource.getChild(path);

                if(child == null){
                    continue;
                }

                node = child.adaptTo(Node.class);

                if(property != null){
                    node.setProperty(property, data);
                }
            }

            dstResource.getResourceResolver().commit();

            JSONObject returnObj = new JSONObject();

            returnObj.put("success", "created page - " + dstResource.getPath());

            response.getWriter().print(returnObj);
        } catch (Exception e) {
            log.error("Could not create page", e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void addImageInDam(JSONObject pageData, ResourceResolver resolver) throws Exception{
        if(!pageData.has("image")){
            return;
        }

        JSONObject imageObject = pageData.getJSONObject("image");

        String assetPath = imageObject.getString("path");
        String imageBinary = imageObject.getString("binary");

        String fileName = assetPath.substring(assetPath.lastIndexOf("/") + 1);
        String folderPath = assetPath.substring(0, assetPath.lastIndexOf("/"));

        Resource folder = resolver.getResource(folderPath);

        if(folder == null){
            log.debug("Folder does not exist, creating - " + folderPath);

            JcrUtil.createPath(folderPath, "sling:Folder", resolver.adaptTo(Session.class));
        }

        byte[] decoded = Base64.getDecoder().decode(imageBinary.getBytes());

        //JcrUtils.putFile(folder.adaptTo(Node.class), fileName, "application/octet-stream", new ByteArrayInputStream(decoded));

        AssetManager assetManager = resolver.adaptTo(AssetManager.class);

        assetManager.createAsset(assetPath, new ByteArrayInputStream(decoded), mimeTypeService.getMimeType(fileName), false);
    }

    private String getPageName(JSONObject pageData) throws Exception{
        String pageName = pageData.getString("jcr:content@jcr:title");
        return JcrUtil.createValidName(pageName);
    }


    private String getUsage(){
        return "usage: curl -u admin:admin -X POST -F file=@\"create-page-content.json\" -F src=\"/content/experience-aem/master/one\" http://localhost:4502/content/experience-aem/generated.eaemcreate.json";
    }

    private String writeError(SlingHttpServletResponse response, String error) throws JSONException{
        JSONObject returnObj = new JSONObject();
        returnObj.put("error", error);
        return "";
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