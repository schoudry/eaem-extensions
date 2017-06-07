package apps.mysample.siteadmin;

import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.Session;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.Arrays;
import java.util.Dictionary;
import java.util.List;

@SlingServlet(
        paths="/bin/mycomponents/siteadmin/templates",
        methods = "GET",
        metatype = false,
        label = "SiteAdmin Templates Servlet"
)
public class SiteAdminTemplates extends SlingAllMethodsServlet {
    protected static Dictionary SETTINGS = null;

    private static final Logger log = LoggerFactory.getLogger(SiteAdminTemplates.class);

    /**
     *
     * @param context
     * @throws Exception
     */
    protected void activate(ComponentContext context) throws Exception {
        SETTINGS = context.getProperties();
    }

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        JSONWriter jw = new JSONWriter(response.getWriter());

        try{
            ResourceResolver resolver = request.getResourceResolver();
            Session session = resolver.adaptTo(Session.class);

            List<String> templates = Arrays.asList((String[])SETTINGS.get("templatePaths"));
            String stmt = "//element(*,cq:Template) order by @jcr:title";

            QueryManager qm = session.getWorkspace().getQueryManager();
            Query q = qm.createQuery(stmt, Query.XPATH);

            NodeIterator results = q.execute().getNodes();
            Node node = null; String path = null;

            jw.object();
            jw.key("data").array();

            while(results.hasNext()){
                node = results.nextNode();
                path = node.getPath();

                if(!path.startsWith("/")){
                    path = "/apps/" + path;
                }

                if(templates.indexOf(path) == -1){
                    continue;
                }

                jw.object();
                jw.key("id").value(path);
                jw.key("name").value(node.getProperty("jcr:title").getString());
                jw.endObject();
            }

            jw.endArray();
            jw.endObject();
        }catch(Exception e){
            log.error("Error getting templates",e);
            throw new ServletException(e);
        }
    }
}
