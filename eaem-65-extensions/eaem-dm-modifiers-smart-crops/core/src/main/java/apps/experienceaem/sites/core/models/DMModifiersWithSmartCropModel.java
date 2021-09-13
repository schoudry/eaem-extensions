package apps.experienceaem.sites.core.models;

import com.day.cq.dam.api.Asset;
import com.day.cq.wcm.api.Page;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Optional;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

@Model(
        adaptables = {
                SlingHttpServletRequest.class
        })
public class DMModifiersWithSmartCropModel {
    private static Logger log = LoggerFactory.getLogger(DMModifiersWithSmartCropModel.class);

    private static String META_S7_DOMAIN = "dam:scene7Domain";

    private static String META_S7_FILE = "dam:scene7File";

    @Inject
    SlingHttpServletRequest request;

    @Inject
    Page currentPage;

    @ValueMapValue
    @Optional
    private String fileReference;

    @ValueMapValue
    @Optional
    private String smartCrop;

    private String s7Src;

    @PostConstruct
    protected void init() {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;
        ResourceResolver resolver = slingRequest.getResourceResolver();

        if(StringUtils.isEmpty(fileReference)){
            return;
        }

        Resource imgResource = resolver.getResource(fileReference);

        if(imgResource == null){
            return;
        }

        Asset imgAsset = imgResource.adaptTo(Asset.class);

        String s7Domain = imgAsset.getMetadataValue(META_S7_DOMAIN);

        String s7File = imgAsset.getMetadataValue(META_S7_FILE);

        s7Src = s7Domain + "is/image/" + s7File;
    }

    public String getFileReference() {
        return fileReference;
    }

    public String getSmartCrop() {
        return smartCrop;
    }

    public String getS7ResponsiveAPI() {
        return "https://s7d9.scene7.com/s7viewers/libs/responsive_image.js";
    }

    public String getS7Src() {
        return s7Src;
    }
}
