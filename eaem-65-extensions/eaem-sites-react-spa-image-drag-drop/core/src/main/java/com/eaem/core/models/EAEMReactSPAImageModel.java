package com.eaem.core.models;

import com.adobe.cq.export.json.ComponentExporter;
import com.adobe.cq.wcm.core.components.models.Image;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;

import javax.annotation.PostConstruct;

@Model(
        adaptables = {SlingHttpServletRequest.class},
        adapters = {Image.class, ComponentExporter.class},
        resourceType = {"eaem-sites-spa-how-to-react/components/not_use_image"}
)
@Exporter(
        name = "jackson",
        extensions = {"json"}
)
public class EAEMReactSPAImageModel implements Image {

    @PostConstruct
    protected void initModel() {
    }
}
