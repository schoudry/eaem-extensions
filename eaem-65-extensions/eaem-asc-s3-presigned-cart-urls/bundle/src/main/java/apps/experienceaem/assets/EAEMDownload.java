package apps.experienceaem.assets;

import com.day.cq.dam.api.Asset;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.request.RequestParameter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Required;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;

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

        RequestParameter[] requestParameters = request.getRequestParameters("path");
        ResourceResolver resolver = request.getResourceResolver();
        List<Asset> assets = new ArrayList<Asset>();

        for (RequestParameter requestParameter : requestParameters) {
            Resource resource = resolver.getResource(requestParameter.getString());

            if(resource == null){
                continue;
            }

            assets.add(resource.adaptTo(Asset.class));
        }

        try{
            cartSize = eaems3Service.getSizeOfContents(assets);
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

