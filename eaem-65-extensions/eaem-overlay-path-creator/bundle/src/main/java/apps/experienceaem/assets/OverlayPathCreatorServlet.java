package apps.experienceaem.assets;

import com.day.cq.commons.jcr.JcrUtil;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONObject;

import org.osgi.service.component.annotations.Component;

import javax.jcr.Node;
import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(
        name = "Experience AEM Overlay Creator",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.selectors=eaemcreate",
                "sling.servlet.methods=GET",
                "sling.servlet.paths=/bin/experience-aem/create/overlay"
        }
)
public class OverlayPathCreatorServlet extends SlingAllMethodsServlet {
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException,IOException {
        String path = request.getParameter("path");
        String copyChildren = request.getParameter("copyChildren");

        String srcHierarchy = "/libs", desHierarchy = "/apps";

        JSONObject json = new JSONObject();

        try {
            ResourceResolver resolver = request.getResourceResolver();

            if (StringUtils.isEmpty(path) || !path.trim().startsWith("/libs")) {
                json.put("error", "Path should start with /libs");
                response.getWriter().print(json);
                return;
            }

            Session session = resolver.adaptTo(Session.class);
            Resource destResource = null, srcResource = null, parentDestResource = null;

            Node srcNode = null; String token;
            String tokens[] = path.substring("/libs".length()).split("/");

            for(int index = 0; index < tokens.length; index++){
                token = tokens[index];

                if(StringUtils.isEmpty(token)){
                    continue;
                }

                desHierarchy = desHierarchy + "/" + token;
                srcHierarchy = srcHierarchy + "/" + token;

                destResource = resolver.getResource(desHierarchy);

                if(destResource != null){
                    continue;
                }

                srcResource = resolver.getResource(srcHierarchy);

                if(srcResource == null){
                    throw new ServletException("Error finding resource - " + srcHierarchy);
                }

                srcNode = srcResource.adaptTo(Node.class);

                if(index == (tokens.length - 1) && "true".equalsIgnoreCase(copyChildren)){
                    JcrUtil.copy(srcNode, parentDestResource.adaptTo(Node.class), null);
                }else{
                    JcrUtil.createPath(desHierarchy, srcNode.getPrimaryNodeType().getName(), session);
                    parentDestResource = resolver.getResource(desHierarchy);
                }
            }

            session.save();

            json.put("success", "Created " + desHierarchy);

            response.getWriter().print(json);
        } catch (Exception e) {
            throw new ServletException("Error creating - " + desHierarchy, e);
        }
    }
}
