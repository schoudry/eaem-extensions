package com.eaem.core.models.impl;

import com.adobe.cq.export.json.ContainerExporter;
import com.day.cq.wcm.foundation.model.responsivegrid.ResponsiveGrid;
import com.day.cq.wcm.foundation.model.responsivegrid.export.ResponsiveGridExporter;
import com.eaem.core.models.EAEMDMVideoContainerModelExporter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.apache.sling.api.SlingHttpServletRequest;
import com.adobe.cq.export.json.ComponentExporter;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.InjectionStrategy;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

import java.util.Map;

@Model(
        adaptables = {SlingHttpServletRequest.class},
        adapters = {EAEMDMVideoContainerModelImpl.class, ContainerExporter.class},
        resourceType = {"eaem-sites-spa-dm-video-container/components/contaisner"}
)
@Exporter(
        name = "jackson",
        extensions = {"json"}
)
@JsonSerialize(as = EAEMDMVideoContainerModelExporter.class)
public class EAEMDMVideoContainerModelImpl extends ResponsiveGrid implements EAEMDMVideoContainerModelExporter{

    public String getDMVideoPath() {
        return "Sreek";
    }
}
