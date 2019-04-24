package apps.experienceaem.sites;

import com.day.cq.commons.jcr.JcrUtil;
import com.day.cq.dam.api.AssetManager;
import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.PageManager;
import org.apache.commons.lang3.StringUtils;
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
import com.adobe.cq.dam.cfm.ContentFragment;
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
/*@Component(
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.paths=/bin/eaem/create",
                "sling.servlet.methods=POST"
        }
)*/
public class PageCreateServlet extends SlingAllMethodsServlet{
    private static final Logger log = LoggerFactory.getLogger(PageCreateServlet.class);

    private static final String SOURCE_PATH = "src";
    //private static final String SOURCE_PATH = "source";
    private static final String DESTINATION = "destination";
    private static final String CF_FOLDER = "cffolder";

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

            if(resolver.getResource(destination) != null){
                writeError(response, "page already exists, deleting... - " + destination);

                resolver.delete(resolver.getResource(destination));

                resolver.commit();

                return;
            }

            addImageInDam(pageData, resolver);

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

    private void createPageFromCF(SlingHttpServletRequest request, SlingHttpServletResponse response){
        addJSONHeaders(response);

        try {
            String srcPath = request.getParameter(SOURCE_PATH);

            if(StringUtils.isEmpty(srcPath)){
                writeError(response, "src empty - " + getUsage());
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

            String destination = request.getParameter(DESTINATION);
            String cfFolderPath = request.getParameter(CF_FOLDER);

            Resource campaignFolder = resolver.getResource(cfFolderPath);
            Iterator<Resource> campaignFolderItr = campaignFolder.listChildren();
            Resource brandFolder = null;
            Resource dstResource = null;

            while(campaignFolderItr.hasNext()){
                brandFolder = campaignFolderItr.next();

                if(brandFolder.getName().equals("jcr:content")){
                    continue;
                }

                destination = request.getParameter(DESTINATION) + "/" + JcrUtil.createValidName(brandFolder.getName());

                dstResource = resolver.getResource(destination);

                if(dstResource == null){
                    dstResource = pageManager.copy(srcPage.adaptTo(Resource.class), destination, null, false, true);
                }

                Iterator<Resource> langFolderItr = brandFolder.listChildren();

                while(langFolderItr.hasNext()){
                    Resource langFolder = langFolderItr.next();

                    if(langFolder.getName().equals("jcr:content")){
                        continue;
                    }

                    String langDestPath = destination + "/" + JcrUtil.createValidName(langFolder.getName());

                    dstResource = resolver.getResource(langDestPath);

                    if(dstResource == null){
                        dstResource = pageManager.copy(srcPage.adaptTo(Resource.class), langDestPath, null, false, true);
                    }

                    Iterator<Resource> cfItr = langFolder.listChildren();

                    while(cfItr.hasNext()){
                        Resource cfResource = cfItr.next();

                        if(cfResource.getName().equals("jcr:content")){
                            continue;
                        }

                        ContentFragment cf = cfResource.adaptTo(ContentFragment.class);

                        String country = cf.getElement("country").getValue().getValue(String.class);

                        String cfPagePath = langDestPath + "/" + JcrUtil.createValidName(country);

                        dstResource = resolver.getResource(cfPagePath);

                        if(dstResource == null){
                            dstResource = pageManager.copy(srcPage.adaptTo(Resource.class), cfPagePath, null, false, true);
                        }

                        String title = cf.getElement("title").getValue().getValue(String.class);
                        setNodeValue(dstResource, "title", title);

                        String body = cf.getElement("body").getValue().getValue(String.class);
                        setNodeValue(dstResource, "body", body);

                        String toc = cf.getElement("toc").getValue().getValue(String.class);
                        setNodeValue(dstResource, "toc", toc);

                        String image = cf.getElement("fileReference").getValue().getValue(String.class);
                        Resource child = dstResource.getChild("jcr:content/content/image");

                        Node node = child.adaptTo(Node.class);
                        node.setProperty("fileReference", image);
                    }
                }
            }

            resolver.commit();

            JSONObject returnObj = new JSONObject();

            response.getWriter().print(returnObj);
        } catch (Exception e) {
            log.error("Could not create page", e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void setNodeValue(Resource dstResource, String property, String data) throws Exception{
        Resource child = dstResource.getChild("jcr:content/content/" + property);
        Node node = child.adaptTo(Node.class);

        if(property != null){
            node.setProperty("text", data);
        }
    }


    private void addImageInDam(JSONObject pageData, ResourceResolver resolver) throws Exception{
        if(!pageData.has("image")){
            return;
        }

        JSONObject imageObject = pageData.getJSONObject("image");

        String assetPath = imageObject.getString("path");

        if(resolver.getResource(assetPath) != null){
            resolver.delete(resolver.getResource(assetPath));
            resolver.commit();
        }

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

        assetManager.createAsset(assetPath, new ByteArrayInputStream(decoded), mimeTypeService.getMimeType(fileName), true);
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