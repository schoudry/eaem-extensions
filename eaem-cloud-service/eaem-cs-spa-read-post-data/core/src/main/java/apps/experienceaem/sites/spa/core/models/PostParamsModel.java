package apps.experienceaem.sites.spa.core.models;

import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.PageManager;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Model(
        adaptables = {SlingHttpServletRequest.class}
)
public class PostParamsModel {
    private static Logger log = LoggerFactory.getLogger(PostParamsModel.class);

    @Inject
    SlingHttpServletRequest request;

    private String eaemInitialData;

    @PostConstruct
    protected void init() {
        String eaemName = request.getParameter("eaemName");
        String eaemEmail = request.getParameter("eaemEmail");

        JSONObject jsonObject = new JSONObject();

        try{
            jsonObject.put("eaemName", eaemName);
            jsonObject.put("eaemEmail", eaemEmail);
        }catch (Exception e){
            log.error("Error creating eaemInitialData from request",e);
        }

        eaemInitialData = jsonObject.toString();
    }

    /**
     * @return brand
     */
    public String getEaemInitialData() {
        return eaemInitialData;
    }
}
