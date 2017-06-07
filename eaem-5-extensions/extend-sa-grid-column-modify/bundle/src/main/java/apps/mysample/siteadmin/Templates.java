package apps.mysample.siteadmin;

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
        paths="/bin/mycomponents/templates",
        methods = "GET",
        metatype = false,
        label = "Templates Servlet"
)
public class Templates extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(Templates.class);

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

            jw.object();
            jw.key("data").array();

            String stmt = "select * from cq:Template order by jcr:title";

            Query q = qm.createQuery(stmt, Query.SQL);

            NodeIterator results = q.execute().getNodes();
            Node node = null;

            while(results.hasNext()){
                node = results.nextNode();

                jw.object();
                jw.key("id").value(node.getPath());
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
