package apps.experienceaem.assets;

import com.adobe.granite.workflow.exec.Workflow;
import com.adobe.granite.workflow.status.WorkflowStatus;
import org.apache.commons.collections.CollectionUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Component(
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.selectors=eaemworkflow",
                "sling.servlet.methods=GET",
                "sling.servlet.methods=POST",
                "sling.servlet.resourceTypes=sling/servlet/default"
        }
)
public class EAEMGetWorkflowRunning extends SlingAllMethodsServlet {
    private static final Logger logger = LoggerFactory.getLogger(EAEMGetWorkflowRunning.class);

    public final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
                            throws ServletException, IOException {
        String folderPath = request.getRequestPathInfo().getResourcePath();

        response.setContentType("application/json");

        JSONObject workflows = new JSONObject();

        try{
            ResourceResolver resolver = request.getResourceResolver();

            Resource folder = resolver.getResource(folderPath);

            if( (folder == null) || !folder.isResourceType("sling:Folder")){
                response.getWriter().write(workflows.toString());
                return;
            }

            Iterator<Resource> itr = folder.listChildren();
            Resource resource = null;

            while(itr.hasNext()){
                resource = itr.next();

                if(!resource.isResourceType("dam:Asset")){
                    continue;
                }

                WorkflowStatus workflowStatus = resource.adaptTo(WorkflowStatus.class);
                List<Workflow> wfs = workflowStatus.getWorkflows(false);

                if(CollectionUtils.isEmpty(wfs)){
                    continue;
                }

                List<String> names = new ArrayList<String>();

                wfs.forEach( w -> {
                    names.add(w.getWorkflowModel().getTitle());
                });

                workflows.put(resource.getPath(), String.join(",", names));
            }

        }catch(Exception e){
            logger.error("Error creating workflows object", e);
        }

        response.getWriter().write(workflows.toString());
    }
}