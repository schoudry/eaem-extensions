package apps.experienceaem.sites.core.models;

import com.adobe.cq.export.json.ComponentExporter;
import com.adobe.cq.export.json.ExporterConstants;
import com.adobe.cq.wcm.core.components.models.Image;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Via;
import org.apache.sling.models.annotations.injectorspecific.InjectionStrategy;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.apache.sling.models.annotations.via.ResourceSuperType;
import lombok.experimental.Delegate;

@Model(
    adaptables = {SlingHttpServletRequest.class},
    adapters = {Image.class, ComponentExporter.class},
    resourceType = { ImageAltDelegate.RESOURCE_TYPE }
)
@Exporter(name = ExporterConstants.SLING_MODEL_EXPORTER_NAME, extensions = ExporterConstants.SLING_MODEL_EXTENSION)
public class ImageAltDelegate implements Image {
    public static final String RESOURCE_TYPE = "eaem-image-comp-sling-delegate/components/image";

    @SlingObject
    protected Resource resource;

    @Self
    @Via(type = ResourceSuperType.class)
    @Delegate(excludes = DelegationExclusion.class)
    private Image delegate;

    @ValueMapValue(
        name = "alt",
        injectionStrategy = InjectionStrategy.OPTIONAL
    )
    protected String alt;

    @ValueMapValue(
        name = "fileReference",
        injectionStrategy = InjectionStrategy.OPTIONAL
    )
    protected String fileReference;

    @Override
    public String getAlt() {
        return delegate.getAlt() + "-" + fileReference.substring(fileReference.lastIndexOf("/") + 1);
    }

    private interface DelegationExclusion {
        String getAlt();
    }
}
