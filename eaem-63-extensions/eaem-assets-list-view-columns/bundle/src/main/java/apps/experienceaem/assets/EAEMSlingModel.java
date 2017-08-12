package apps.experienceaem.assets;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.*;
import org.apache.sling.models.annotations.injectorspecific.Self;

import javax.inject.Inject;
import javax.inject.Named;

@Model(
        adaptables = Resource.class,
        defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL,
        resourceType = "weretail/components/structure/page"
)
@Exporter(name = "jackson", extensions = "json")
public class EAEMSlingModel {
    @Self
    private Resource resource;

    @Inject
    @Named("jcr:title") @Required
    private String title;

    @Inject @Optional
    private String pageTitle;

    public String getTitle() {
        return StringUtils.defaultIfEmpty(pageTitle, title);
    }
}
