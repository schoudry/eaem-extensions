package apps.mysample.scheduledactivations;

import com.day.cq.workflow.exec.Workflow;
import com.day.cq.workflow.metadata.MetaDataMap;
import com.day.cq.workflow.status.WorkflowStatus;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;

@SlingServlet(
        paths="/bin/mycomponents/schactivation",
        methods = "GET",
        metatype = false,
        label = "Scheduled Activation Instances"
)
public class ScheduledActivationInstances extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(ScheduledActivationInstances.class);
    private static SimpleDateFormat FORMATTER = new SimpleDateFormat("EEE, dd MMM, yyyy HH:mm");

    private static final String ACTIVATE_MODEL = "/etc/workflow/models/scheduled_activation/jcr:content/model";
    private static final String DEACTIVATE_MODEL = "/etc/workflow/models/scheduled_deactivation/jcr:content/model";

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        JSONWriter jw = new JSONWriter(response.getWriter());
        String pageStr = request.getParameter("path");

        try{
            jw.object();

            if(StringUtils.isEmpty(pageStr)){
                jw.key("error").value("page input required");
                jw.endObject();
                return;
            }

            String type = request.getParameter("type");

            if(StringUtils.isEmpty(type)){
                type = "ACTIVATE";
            }

            pageStr = pageStr.trim();
            String[] pages = pageStr.split(",");

            ResourceResolver resolver = request.getResourceResolver();
            Resource resource = null;

            WorkflowStatus wStatus = null;
            List<Workflow> workflows = null;

            Map<String, List<Map<String, String>>> retMap = new HashMap<String, List<Map<String, String>>>();
            Map<String, String> map = null;
            MetaDataMap mdMap = null;

            String absTime = null, id = null, version = null;
            List<Map<String, String>> list = null;

            for(String page: pages){
                if(StringUtils.isEmpty(page)){
                    continue;
                }

                resource = resolver.getResource(page);

                if(resource == null){
                    continue;
                }

                wStatus = resource.adaptTo(WorkflowStatus.class);
                workflows = wStatus.getWorkflows(false);

                if(CollectionUtils.isEmpty(workflows)){
                    continue;
                }

                for (Workflow w: workflows) {
                    id = w.getWorkflowModel().getId();

                    if(type.equals("ACTIVATE") && !id.equals(ACTIVATE_MODEL)){
                        continue;
                    }else if(type.equals("DEACTIVATE") && !id.equals(DEACTIVATE_MODEL)){
                        continue;
                    }

                    list = retMap.get(page);

                    if(list == null){
                        list = new ArrayList<Map<String, String>>();
                        retMap.put(page, list);
                    }

                    map = new HashMap<String, String>();
                    list.add(map);

                    mdMap = w.getMetaDataMap();
                    absTime = mdMap.get("absoluteTime", String.class);

                    map.put("id", w.getId());
                    map.put("name", resource.getChild("jcr:content").adaptTo(ValueMap.class).get("jcr:title", String.class));
                    map.put("st",FORMATTER.format(w.getTimeStarted().getTime()));
                    map.put("ini", w.getInitiator());
                    map.put("type", id.equals(ACTIVATE_MODEL) ? "ACTIVATE" : "DEACTIVATE");
                    map.put("dt", FORMATTER.format(Long.parseLong(absTime)));
                }
            }

            String path = null;
            Iterator<Map<String, String>> itr = null;

            jw.key("data").array();

            for(Map.Entry<String, List<Map<String, String>>> entry : retMap.entrySet()){
                list = entry.getValue();
                path = entry.getKey();

                itr = list.iterator();

                while(itr.hasNext()){
                    jw.object();
                    jw.key("path").value(path);

                    for(Map.Entry<String, String> mEntry : itr.next().entrySet()){
                        jw.key(mEntry.getKey()).value(mEntry.getValue());
                    }

                    jw.endObject();
                }
            }

            jw.endArray();
            jw.endObject();
        }catch(Exception e){
            log.error("Error getting schedule activation instances",e);
            throw new ServletException(e);
        }
    }
}
