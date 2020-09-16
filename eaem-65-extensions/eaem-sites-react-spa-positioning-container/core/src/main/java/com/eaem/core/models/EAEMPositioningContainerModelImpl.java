package com.eaem.core.models;

import com.adobe.cq.export.json.ComponentExporter;
import com.adobe.cq.export.json.ContainerExporter;
import com.day.cq.wcm.foundation.model.responsivegrid.ResponsiveGrid;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Model(
        adaptables = {SlingHttpServletRequest.class},
        adapters = {ContainerExporter.class, ComponentExporter.class},
        resourceType = {"eaem-sites-spa-how-to-react/components/positioning-container"}
)
@Exporter(
        name = "jackson",
        extensions = {"json"}
)
public class EAEMPositioningContainerModelImpl extends ResponsiveGrid implements ContainerExporter{
    @ScriptVariable
    private Resource resource;

    @PostConstruct
    protected void initModel() {
        super.initModel();
    }

    public ValueMap getPositioningContainerProps() {
        return resource.getValueMap();
    }
}
