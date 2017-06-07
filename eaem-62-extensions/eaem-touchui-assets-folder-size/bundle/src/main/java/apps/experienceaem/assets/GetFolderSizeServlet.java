package apps.experienceaem.assets;

import com.day.cq.dam.api.Asset;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import javax.servlet.ServletException;
import java.util.Iterator;
import java.util.Map;

@SlingServlet(
        label = "Experience AEM - Folder Size Servlet",
        description = "Experience AEM - Servlet to return folder size",
        resourceTypes = { "sling:OrderedFolder", "sling:Folder" },
        selectors = { GetFolderSizeServlet.SEL_FOLDER_SIZE },
        methods = "GET")
public class GetFolderSizeServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(GetFolderSizeServlet.class);

    public static final String SEL_FOLDER_SIZE = "size";

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        String folderPath = request.getRequestPathInfo().getResourcePath();

        try{
            String stmt = "SELECT * FROM [dam:Asset] WHERE ISDESCENDANTNODE('" + folderPath + "')";

            ResourceResolver resolver = request.getResourceResolver();
            QueryManager qm = getQueryManager(request);

            JSONObject folderJSON = getFolderMapJSON(resolver.getResource(folderPath));
            JSONObject sizeObj = null;

            Query query = qm.createQuery(stmt, Query.JCR_SQL2);

            NodeIterator results = query.execute().getNodes();
            Node node = null; Asset asset = null;

            Long totalSize = 0L, size;
            Integer totalAssets = 0, countedAssets = 0;

            String superParentPath;

            while (results.hasNext()) {
                node = results.nextNode();

                superParentPath = getSuperParentPath(folderPath, node);

                if(!folderJSON.has(superParentPath)){
                    continue;
                }

                sizeObj = (JSONObject) folderJSON.get(superParentPath);

                totalSize = (Long)sizeObj.get("size");
                totalAssets = (Integer)sizeObj.get("totalAssets");
                countedAssets = (Integer)sizeObj.get("countedAssets");

                asset = resolver.getResource(node.getPath()).adaptTo(Asset.class);

                if(asset.getMetadata("dam:size") instanceof Long){
                    size = (Long)asset.getMetadata("dam:size");
                    countedAssets++;
                    totalSize = totalSize + size;
                }

                totalAssets++;

                sizeObj.put("size", totalSize);
                sizeObj.put("totalAssets", totalAssets);
                sizeObj.put("countedAssets", countedAssets);
            }

            response.getWriter().print(folderJSON);
        }catch(Exception e){
            log.error("Error getting size for - " + folderPath, e);
        }
    }

    private String getSuperParentPath(String folderPath, Node node) throws Exception{
        String assetPath = node.getPath();

        if(node.getParent().getPath().equals(folderPath)){
            return folderPath;
        }

        return folderPath + "/" + assetPath.substring(folderPath.length() + 1, assetPath.indexOf("/", folderPath.length() + 1));
    }

    private JSONObject getFolderMapJSON(Resource folderResource) throws Exception{
        Iterator<Resource> childrenItr = folderResource.listChildren();
        Resource child = null;

        JSONObject folderJSON = new JSONObject();

        while(childrenItr.hasNext()){
            child = childrenItr.next();

            if(child.isResourceType("sling:OrderedFolder") || child.isResourceType("sling:Folder")){
                folderJSON.put(child.getPath(), getSizeObj());
            }
        }

        return folderJSON;
    }

    private JSONObject getSizeObj() throws Exception{
        JSONObject sizeObj = new JSONObject();

        Long totalSize = 0L, size;
        Integer totalAssets = 0, countedAssets = 0;

        sizeObj.put("totalAssets", totalAssets);
        sizeObj.put("countedAssets", countedAssets);
        sizeObj.put("size", totalSize);

        return sizeObj;
    }

    private QueryManager getQueryManager(SlingHttpServletRequest request)throws Exception {
        ResourceResolver resolver = request.getResourceResolver();

        Session session = resolver.adaptTo(Session.class);

        return session.getWorkspace().getQueryManager();
    }
}
