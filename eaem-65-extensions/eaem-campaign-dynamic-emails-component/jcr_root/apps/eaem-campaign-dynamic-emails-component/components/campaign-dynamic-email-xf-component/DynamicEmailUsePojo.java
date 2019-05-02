package apps.eaem_campaign_dynamic_emails_component.components.campaign_dynamic_email_xf_component;

import com.day.cq.tagging.Tag;
import com.day.cq.wcm.api.Page;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobe.cq.sightly.WCMUsePojo;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class DynamicEmailUsePojo extends WCMUsePojo {

    private static final Logger log = LoggerFactory.getLogger(DynamicEmailUsePojo.class);

    private static String CAMPAIGN_FOLDER_PATH = "campaignFolderPath";
    private static String EMAIL_BODY = "emailBody";
    private static String LOCATIONS_NAME_SPACE = "locations";


    private Map<String, String> regionContent = new HashMap<String, String>();

    @Override
    public void activate() {
        String xfFolderPath = getProperties().get(CAMPAIGN_FOLDER_PATH, "");

        if(StringUtils.isEmpty(xfFolderPath)){
            return;
        }

        ResourceResolver resolver = getResourceResolver();

        Resource xfFolder = resolver.getResource(xfFolderPath);

        if(xfFolder == null){
            return;
        }

        Iterator<Resource> xfFolderItr = xfFolder.listChildren();
        Page xfMaster = null;
        Tag[] tags = null;

        while(xfFolderItr.hasNext()){
            xfMaster = xfFolderItr.next().getChild("master").adaptTo(Page.class);

            tags = xfMaster.getTags();

            if(ArrayUtils.isEmpty(tags)) {
                continue;
            }

            for(Tag tag : tags){
                if(!tag.getNamespace().getName().equals(LOCATIONS_NAME_SPACE)){
                    continue;
                }

                regionContent.put(tag.getName(), xfMaster.getPath() + "/jcr:content");
            }
        }
    }

    public Map<String, String> getRegionContent() {
        return regionContent;
    }

    public String getConditionalExpressionBegin(){
        return "<% ";
    }

    public String getConditionalExpressionEnd(){
        return " %>";
    }
}