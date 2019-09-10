package apps.experienceaem.assets;

import com.adobe.aem.commons.assetshare.util.PredicateUtil;
import com.adobe.cq.sightly.WCMUsePojo;
import com.day.cq.search.eval.DateRangePredicateEvaluator;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Random;

public class EAEMDatePredicate extends WCMUsePojo {
    private static final Logger log = LoggerFactory.getLogger(EAEMDatePredicate.class);

    private static final String REQUEST_ATTR_FORM_ID_TRACKER = "asset-share-commons__form-id";

    private ValueMap resourceProps;
    private String property;
    private int group;

    @Override
    public void activate() {
        resourceProps = ResourceUtil.getValueMap(this.getResource());
        property = resourceProps.get("property", "");
        group = new Random().nextInt();
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
