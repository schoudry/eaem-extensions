package apps.mysample.sidekick;

import com.day.cq.commons.LabeledResource;
import com.day.cq.tagging.JcrTagManagerFactory;
import com.day.cq.tagging.Tag;
import com.day.cq.tagging.TagManager;
import com.day.text.Text;
import org.apache.commons.collections.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

@SlingServlet (
        paths="/bin/mycomponents/sidekick/tags",
        methods = "GET",
        metatype = true,
        label = "Tags Servlet"
)
public class GetTagsCheckedForPage extends SlingAllMethodsServlet {
    private static final Logger LOG = LoggerFactory.getLogger(GetTagsCheckedForPage.class);

    @Reference
    JcrTagManagerFactory tmf;

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html");
        response.setCharacterEncoding("utf-8");

        String pagePath = request.getParameter("page");
        String tagPath = request.getParameter("tag");

        try{
            ResourceResolver resolver = request.getResourceResolver();
            Session session = resolver.adaptTo(Session.class);
            TagManager tMgr = tmf.getTagManager(session);

            JSONWriter jw = new JSONWriter(response.getWriter());

            if(StringUtils.isEmpty(pagePath) || StringUtils.isEmpty(tagPath)){
                jw.object();
                jw.key("error").value("required parameters page and tag missing");
                jw.endObject();
                return;
            }

            Resource resource = resolver.getResource(pagePath + "/jcr:content");

            if(resource == null){
                jw.object();
                jw.key("error").value("resource " + pagePath + " not found");
                jw.endObject();
                return;
            }

            Resource parentTag = resolver.getResource(tagPath);

            if(parentTag == null){
                jw.object();
                jw.key("error").value("tag " + parentTag + " not found");
                jw.endObject();
                return;
            }

            Tag[] pageTags = tMgr.getTags(resource);
            List<String> pageTagsList = new ArrayList<String>();

            for(Tag t : pageTags){
                pageTagsList.add(t.getPath());
            }

            Iterator<Resource> itr = parentTag.listChildren();

            Resource tag = null;
            Node node = null;
            String parentPath = null, cls = null;

            jw.array();

            while(itr.hasNext()){
                tag = itr.next();

                if(!tag.getResourceType().equals("cq/tagging/components/tag")){
                    continue;
                }

                parentPath = tag.getParent().getPath();

                jw.object();

                jw.key("name").value(tag.getPath().substring(1));

                cls = parentPath.equals("/etc/tags") || parentPath.equals("/etc") ? "folder" : "tag x-tree-node-icon";

                for(Tag t : pageTags){
                    if(t.getPath().indexOf(tag.getPath()) == 0){
                    //Make the breadcrumb trail bold, the css class x-menu-item-default is defined in CQ as
                    //.x-menu-item-default SPAN { font-weight:bold; }
                    cls = "x-menu-item-default " + cls;
                        break;
                    }
                }

                jw.key("cls").value(cls);

                node = tag.adaptTo(Node.class);

                if(node.hasProperty("jcr:title")){
                    jw.key("text").value(node.getProperty("jcr:title").getString());
                }else{
                    jw.key("text").value(node.getName());
                }

                jw.key("checked").value(pageTagsList.contains(tag.getPath()));

                jw.endObject();
            }

            jw.endArray();
        }catch(Exception e){
            LOG.error("Error getting tags",e);
            throw new ServletException(e);
        }
    }
}
