package apps.experienceaem.assets;

import com.adobe.cq.sightly.WCMUsePojo;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Required;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EAEMDatePredicate extends WCMUsePojo {
    private static final Logger log = LoggerFactory.getLogger(EAEMDatePredicate.class);

    @Override
    public void activate() {
        System.out.println("ssss");
    }

    public boolean isReady() {
        return false;
    }

    public boolean isExpanded() {
        return true;
    }

    public String getId() {
        SlingHttpServletRequest request = getRequest();
        return "cmp-date-filter" + "_" + String.valueOf(request.getResource().getPath().hashCode());
    }
}
