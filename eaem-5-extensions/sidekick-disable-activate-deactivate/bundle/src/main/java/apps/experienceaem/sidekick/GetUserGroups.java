package apps.experienceaem.sidekick;

import org.apache.jackrabbit.api.security.user.Group;
import org.apache.jackrabbit.api.security.user.User;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import java.io.IOException;
import java.util.Iterator;

@SlingServlet(
        paths = "/bin/experienceaem/getgroups",
        methods = "GET",
        metatype = false,
        label = "Get user groups"
)
public class GetUserGroups extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(GetUserGroups.class);

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        JSONWriter jw = new JSONWriter(response.getWriter());

        try {
            ResourceResolver resolver = request.getResourceResolver();
            User user = resolver.adaptTo(User.class);

            Iterator<Group> groups = user.memberOf();
            jw.object();
            jw.key(user.getID()).array();

            while(groups.hasNext()){
                jw.value(groups.next().getID());
            }

            jw.endArray();
            jw.endObject();
        } catch (Exception e) {
            log.error("Error getting groups", e);
            throw new ServletException(e);
        }
    }
}