package apps.mysample.searchpanel;

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
import javax.jcr.Property;
import javax.jcr.Session;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import javax.servlet.ServletException;
import java.io.IOException;

@SlingServlet(
        paths="/bin/mycomponents/searchpanel/templates",
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

            String stmt = "select * from cq:Template where jcr:path like '/apps/%' order by jcr:title";
            Query q = qm.createQuery(stmt, Query.SQL);

            NodeIterator results = q.execute().getNodes();
            Node node = null ; Property title = null;

            jw.object();
            jw.key("jcr:title");
            jw.value("Templates");

            while(results.hasNext()){
                node = results.nextNode();

                if(!node.hasProperty("jcr:title")){
                    continue;
                }

                title = node.getProperty("jcr:title");

                jw.key(node.getPath());
                jw.object();
                jw.key("jcr:title");
                jw.value(title.getString());
                jw.key("tagId");
                jw.value(node.getPath());
                jw.endObject();
            }

            jw.endObject();
        }catch(Exception e){
            log.error("Error getting templates",e);
            throw new ServletException(e);
        }
    }
}