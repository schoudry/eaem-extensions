package apps.experienceaem.assets.core.filters;

import com.day.cq.commons.Externalizer;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Optional;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.apache.sling.settings.SlingSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

@Model(
        adaptables = {SlingHttpServletRequest.class}
)
public class ImageModel {
    private static Logger log = LoggerFactory.getLogger(ImageModel.class);

    @Inject
    SlingHttpServletRequest request;

    @Inject
    private SlingSettingsService slingSettingsService;

    @ValueMapValue
    @Optional
    private String fileReference;

    private String src = "";

    @PostConstruct
    protected void init() {
        if(StringUtils.isEmpty(fileReference)){
            return;
        }

        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;
        ResourceResolver resolver = slingRequest.getResourceResolver();

        Externalizer externalizer = resolver.adaptTo(Externalizer.class);
        boolean isAuthor = slingSettingsService.getRunModes().contains(Externalizer.AUTHOR);

        src = !isAuthor ? externalizer.publishLink(resolver, fileReference) : externalizer.authorLink(resolver, fileReference);
    }

    public String getSrc(){
        return src;
    }
}