package com.eaem.core.models.impl;

import com.adobe.cq.export.json.ContainerExporter;
import com.adobe.cq.wcm.core.components.models.LayoutContainer;
import com.day.cq.wcm.foundation.model.responsivegrid.ResponsiveGrid;
import com.day.cq.wcm.foundation.model.responsivegrid.export.ResponsiveGridExporter;
import com.eaem.core.models.EAEMDMVideoContainerModelExporter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import com.adobe.cq.export.json.ComponentExporter;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.InjectionStrategy;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

import java.util.Map;

@Model(
        adaptables = {SlingHttpServletRequest.class},
        adapters = {ContainerExporter.class, ComponentExporter.class},
        resourceType = {"eaem-sites-spa-dm-video-container/components/container"}
)
@Exporter(
        name = "jackson",
        extensions = {"json"}
)
@JsonSerialize(as = EAEMDMVideoContainerModelExporter.class)
public class EAEMDMVideoContainerModelImpl extends ResponsiveGrid implements EAEMDMVideoContainerModelExporter{
    @ScriptVariable
    private Resource resource;

    @ValueMapValue(injectionStrategy = InjectionStrategy.OPTIONAL)
    private String eaemDMVideo;

    @ValueMapValue(injectionStrategy = InjectionStrategy.OPTIONAL)
    private String eaemDMEncode;

    @PostConstruct
    protected void initModel() {
        if( (this.resource == null) || StringUtils.isEmpty(eaemDMVideo)) {
            return;
        }

        ValueMap properties = this.resource.getValueMap();

        ResourceResolver resolver = this.resource.getResourceResolver();
        Resource videoRes = resolver.getResource(eaemDMVideo);

        if(videoRes == null){
            return;
        }

    }

    public String getDmVideoPath() {
        return eaemDMVideo;
    }

    public String getDmVideoEncode() {
        return eaemDMEncode;
    }
}
