package apps.experienceaem.sites;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Model;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.Group;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Required;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.util.*;

@Model(adaptables = SlingHttpServletRequest.class)
public class EAEMImpersonationModel {
    private static final Logger log = LoggerFactory.getLogger(EAEMImpersonationModel.class);

    private static final String PROP_IMPERSONATION_GROUP = "impersonatorsGroup";

    @Self
    @Required
    private SlingHttpServletRequest request;

    private boolean showImpersonation;

    @PostConstruct
    private void init() {
        showImpersonation = false;

        try {
            if(request.getCookie("sling.sudo") != null){
                showImpersonation = true;
                return;
            }

            ResourceResolver resolver = request.getResourceResolver();

            ValueMap resourceProps = ResourceUtil.getValueMap(request.getResource());
            String impersonationGroup = resourceProps.get(PROP_IMPERSONATION_GROUP, "");

            if(StringUtils.isEmpty(impersonationGroup)){
                return;
            }

            Authorizable auth = resolver.adaptTo(Authorizable.class);
            Iterator<Group> groups = auth.memberOf();

            while(groups.hasNext()){
                if(groups.next().getID().equalsIgnoreCase(impersonationGroup)){
                    showImpersonation = true;
                    return;
                }
            }
        } catch (Exception e) {
            log.error("Error getting impersonation model", e);
        }
    }

    public boolean getShowImpersonation() {
        return showImpersonation;
    }
}

