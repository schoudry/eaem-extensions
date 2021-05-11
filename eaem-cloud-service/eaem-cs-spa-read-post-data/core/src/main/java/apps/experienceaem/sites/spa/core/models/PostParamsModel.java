package apps.experienceaem.sites.spa.core.models;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Model;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

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
