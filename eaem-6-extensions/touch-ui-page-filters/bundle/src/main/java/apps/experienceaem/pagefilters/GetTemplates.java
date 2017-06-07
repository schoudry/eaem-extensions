package apps.experienceaem.pagefilters;

import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.Session;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import javax.servlet.ServletException;
import java.io.IOException;

@SlingServlet(
        paths="/bin/experience-aem/touch-ui/page-filters/templates",
        methods = "GET",
        metatype = false,
        label = "Get Templates Servlet"
)
public class GetTemplates extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(GetTemplates.class);

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        JSONWriter jw = new JSONWriter(response.getWriter());

        try{
            ResourceResolver resolver = request.getResourceResolver();
            Session session = resolver.adaptTo(Session.class);
            QueryManager qm = session.getWorkspace().getQueryManager();

            String stmt = "//element(*,cq:Template)[jcr:like(@jcr:path, '/apps/%')] order by @jcr:title";

            Query q = qm.createQuery(stmt, Query.XPATH);

            NodeIterator results = q.execute().getNodes();
            Node node = null, tNode = null; String path = null;

            jw.array();

            while(results.hasNext()){
                node = results.nextNode();
                path = node.getProperty("jcr:content/sling:resourceType").getString();

                if(path.startsWith("/apps/")){
                    path = path.substring(6);//remove /apps/
                }

                jw.object();
                jw.key("id").value(path);
                jw.key("name").value(node.getProperty("jcr:title").getString());
                jw.endObject();
            }

            jw.endArray();
        }catch(Exception e){
            log.error("Error getting templates",e);
            throw new ServletException(e);
        }
    }
}