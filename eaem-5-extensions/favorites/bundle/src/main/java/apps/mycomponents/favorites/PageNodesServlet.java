package apps.mycomponents.favorites;

import com.day.cq.commons.LabeledResource;
import com.day.text.Text;
import org.apache.commons.collections.Predicate;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

@SlingServlet (
    paths="/bin/mycomponents/favorites/pagenodes",
    methods = "GET",
    metatype = true,
    label = "Page Nodes Servlet"
)
public class PageNodesServlet extends SlingAllMethodsServlet {
    private static final long serialVersionUID = 1L;

    private static final Logger LOG = LoggerFactory.getLogger(PageNodesServlet.class);

    class FolderOrPagePredicate implements Predicate {
        @Override
        public boolean evaluate(Object o) {
            Resource resource = (Resource)o;
            return resource.getResourceType().equals("sling:Folder") || resource.getResourceType().equals("cq:Page");
        }
    }

    private final Predicate FOLDER_PAGE_PREDICATE = new FolderOrPagePredicate();

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
                                throws ServletException, IOException {
        response.setContentType("text/html");
        response.setCharacterEncoding("utf-8");

        String path = request.getParameter("path");
        String type = request.getParameter("type");

        if( ( type == null ) || type.trim().equals("")){
            type = "all";
        }

        ResourceResolver resolver = request.getResourceResolver();
        Resource res = resolver.getResource(path);
        Session userSession = resolver.adaptTo(Session.class);

        List<Resource> children = new LinkedList<Resource>();
        JSONWriter jw = new JSONWriter(response.getWriter());

        try{
            for (Iterator iter = resolver.listChildren(res); iter.hasNext(); ) {
                Resource child = (Resource)iter.next();

                if(FOLDER_PAGE_PREDICATE.evaluate(child) && hasPermission(type, userSession, child.getPath())){
                    children.add(child);
                }
            }

            write(request, jw, children, type);
        }catch(Exception e){
            LOG.error("Error getting nodes",e);
            throw new ServletException(e);
        }
    }

    private boolean hasPermission(String type, Session userSession, String resourcePath) throws Exception{
        return "all".equals(type) || userSession.hasPermission(resourcePath, "set_property");
    }

    private boolean hasChildren(Resource res, ResourceResolver resolver, String type ) throws Exception{
        Session userSession = resolver.adaptTo(Session.class);
        Iterator<Resource> iter = resolver.listChildren(res);

        while (iter.hasNext()) {
            Resource child = iter.next();
            if (FOLDER_PAGE_PREDICATE.evaluate(child) && hasPermission(type, userSession, child.getPath())) {
                return true;
            }
        }

        return false;
    }

    public void write(SlingHttpServletRequest request, JSONWriter out, List<Resource> list, String type) throws Exception{
        ResourceResolver resolver = request.getResourceResolver();
        out.array();

        for (Resource resource : list) {
            out.object();

            LabeledResource lr = resource.adaptTo(LabeledResource.class);
            String name = Text.getName(resource.getPath());

            out.key("name").value(name);
            out.key("type").value(resource.getResourceType());

            boolean hasChildren = hasChildren(resource, resolver, type);

            out.key("cls").value(hasChildren ? "folder" : "file");

            if (!hasChildren) {
                out.key("leaf").value(true);
            }

            String text;

            if (lr == null) {
                text = name;
            } else {
                text = lr.getTitle() == null ? name : lr.getTitle();
            }

            out.key("text").value(text);
            out.endObject();
        }

        out.endArray();
    }
}
