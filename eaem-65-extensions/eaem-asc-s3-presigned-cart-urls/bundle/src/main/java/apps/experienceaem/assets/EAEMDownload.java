package apps.experienceaem.assets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Required;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.osgi.service.component.annotations.Reference;

import javax.annotation.PostConstruct;

@Model(
        adaptables = {SlingHttpServletRequest.class},
        resourceType = {EAEMDownload.RESOURCE_TYPE}
)
public class EAEMDownload {
    protected static final String RESOURCE_TYPE = "/apps/eaem-asc-s3-presigned-cart-urls/components/download";

    @Self
    @Required
    protected SlingHttpServletRequest request;

    @OSGiService
    @Required
    private EAEMS3Service eaems3Service;

    protected Long directDownloadLimit;

    @PostConstruct
    protected void init() {
        directDownloadLimit = eaems3Service.getDirectDownloadLimit();
    }
}

