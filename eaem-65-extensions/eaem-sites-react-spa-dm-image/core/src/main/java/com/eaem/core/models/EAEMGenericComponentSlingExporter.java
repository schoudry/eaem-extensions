package com.eaem.core.models;

import com.adobe.cq.export.json.ComponentExporter;
import com.adobe.cq.export.json.ExporterConstants;
import com.adobe.cq.wcm.core.components.models.Image;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import java.util.Map;

@Model(
        adaptables = {SlingHttpServletRequest.class},
        adapters = {ComponentExporter.class},
        resourceType = {
                "eaem-sites-spa-how-to-react/components/image",
                "eaem-sites-spa-how-to-react/components/dm-image-smart-crop"
        }
)
@Exporter(
        name = ExporterConstants.SLING_MODEL_EXPORTER_NAME,
        extensions = ExporterConstants.SLING_MODEL_EXTENSION
)
public class EAEMGenericComponentSlingExporter implements ComponentExporter {

    @Inject
    private Resource resource;

    @PostConstruct
    protected void initModel() {
    }

    public ValueMap getEaemData(){
        return resource.getValueMap();
    }

    @Override
    public String getExportedType() {
        return resource.getResourceType();
    }
}
