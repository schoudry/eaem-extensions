package apps.experienceaem.assets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Required;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;

@Model(
        adaptables = {SlingHttpServletRequest.class},
        resourceType = {EAEMDownload.RESOURCE_TYPE}
)
public class EAEMDownload {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    protected static final String RESOURCE_TYPE = "/apps/eaem-asc-s3-presigned-cart-urls/components/download";

    @Self
    @Required
    protected SlingHttpServletRequest request;

    @OSGiService
    @Required
    private EAEMS3Service eaems3Service;

    protected Long directDownloadLimit;

    protected Long cartSize;

    @PostConstruct
    protected void init() {
        directDownloadLimit = eaems3Service.getDirectDownloadLimit();

        try{
            cartSize = eaems3Service.getSizeOfContents(eaems3Service.getAssets(request.getResourceResolver(),
                                request.getRequestParameters("path")));
        }catch (Exception e){
            logger.error("Error calculating cart size", e);
        }
    }

    public long getDirectDownloadLimit() {
        return this.directDownloadLimit;
    }

    public long getCartSize() {
        return this.cartSize;
    }
}

