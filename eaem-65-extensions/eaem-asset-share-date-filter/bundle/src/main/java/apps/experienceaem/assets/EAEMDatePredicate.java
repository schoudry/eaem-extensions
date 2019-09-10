package apps.experienceaem.assets;

import com.adobe.aem.commons.assetshare.util.PredicateUtil;
import com.adobe.cq.sightly.WCMUsePojo;
import com.day.cq.search.eval.DateRangePredicateEvaluator;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EAEMDatePredicate extends WCMUsePojo {
    private static final Logger log = LoggerFactory.getLogger(EAEMDatePredicate.class);

    private static final String REQUEST_ATTR_FORM_ID_TRACKER = "asset-share-commons__form-id";
    private static final String COMPONENT_NAME_IN_PAGE = "date_range";
    private static final int INITIAL_GROUP_NUM = 99999;

    private ValueMap resourceProps;
    private String property;
    private int group;

    @Override
    public void activate() {
        Resource resource = getResource();

        resourceProps = ResourceUtil.getValueMap(resource);
        property = resourceProps.get("property", "");
        group = INITIAL_GROUP_NUM;

        String compName = COMPONENT_NAME_IN_PAGE + "_";
        String resName = resource.getName();

        if(resName.contains(compName)) {
            group = Integer.parseInt(resName.substring(resName.lastIndexOf("_") + 1));
        }
    }

    public boolean isReady() {
        return StringUtils.isNotEmpty(property);
    }

    public String getTitle() {
        return resourceProps.get("jcr:title", "");
    }

    public String getGroup() {
        return group + "_group";
    }

    public String getName() {
        return "relativedaterange";
    }

    public String getProperty() {
        return property;
    }

    public boolean isExpanded() {
        return Boolean.valueOf(resourceProps.get("expanded", "false"));
    }

    public String getFormId() {
        SlingHttpServletRequest request = getRequest();

        if (request.getAttribute(REQUEST_ATTR_FORM_ID_TRACKER) == null) {
            request.setAttribute(REQUEST_ATTR_FORM_ID_TRACKER, 1);
        }

        return REQUEST_ATTR_FORM_ID_TRACKER + "__" + String.valueOf(request.getAttribute(REQUEST_ATTR_FORM_ID_TRACKER));
    }

    public String getLowerBoundName() {
        return getName() + "." + DateRangePredicateEvaluator.LOWER_BOUND;
    }

    public String getInitialLowerBound() {
        return PredicateUtil.getParamFromQueryParams(getRequest(), getGroup() + "." + getLowerBoundName());
    }

    public String getId() {
        SlingHttpServletRequest request = getRequest();
        return "cmp-date-filter" + "_" + String.valueOf(request.getResource().getPath().hashCode());
    }
}
