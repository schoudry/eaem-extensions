package apps.experienceaem.omnisearch;

import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@SlingServlet(paths = "/bin/eaem/metadataResults",
        methods = "GET",
        metatype = true,
        label = "Experience AEM Metadata Results Servlet",
        extensions = "json")
public class MetadataResultsServlet extends SlingAllMethodsServlet{
    private static final Logger log = LoggerFactory.getLogger(MetadataResultsServlet.class);

    private static String OMNI_SEARCH_COL_CONFIG = "/etc/experience-aem/omni-search-columns/jcr:content/list";

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        doPost(request, response);
    }

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        ResourceResolver resourceResolver = request.getResourceResolver();

        try{
            JSONObject jsonResponse = new JSONObject();

            String paths = request.getParameter("paths");

            if(StringUtils.isEmpty(paths)){
                return;
            }else{
                List<String> configList = getOmniSearchConfigValues(resourceResolver.getResource(OMNI_SEARCH_COL_CONFIG));

                Resource resource, propResource;
                String parentPath, propName, propValue;

                JSONObject valueObj;

                for(String path : paths.split(",")){
                    resource = resourceResolver.getResource(path);

                    if(resource == null){
                        continue;
                    }

                    valueObj = new JSONObject();

                    for(String relPath : configList){
                        parentPath = relPath.substring(0, relPath.lastIndexOf("/"));
                        propName = relPath.substring(relPath.lastIndexOf("/") + 1);

                        propResource = resource.getChild(parentPath);

                        if(propResource == null){
                            continue;
                        }

                        propValue = propResource.adaptTo(ValueMap.class).get(propName, "");

                        valueObj.put(relPath, propValue);
                    }

                    jsonResponse.put(path, valueObj);
                }
            }

            jsonResponse.write(response.getWriter());
        }catch(Exception e){
            log.error("Error reading collections", e);
        }

    }

    public List<String> getOmniSearchConfigValues(Resource managedListResource) {
        List<String> configList = new ArrayList<String>();

        try {
            Iterator<Resource> managedList = managedListResource.listChildren();

            while (managedList.hasNext()) {
                Resource r = managedList.next();
                Node resNode = r.adaptTo(Node.class);

                if (!resNode.hasProperty("value")) {
                    continue;
                }

                configList.add(resNode.getProperty("value").getString());
            }

        } catch (RepositoryException re) {
            log.error("Error getting list values", re);
        }

        return configList;
    }
}
