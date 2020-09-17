package com.eaem.core.models;

import com.adobe.cq.export.json.ComponentExporter;
import com.adobe.cq.export.json.ContainerExporter;
import com.day.cq.wcm.foundation.model.responsivegrid.ResponsiveGrid;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
@JsonSerialize(as = EAEMPositioningContainerModel.class)
public class EAEMPositioningContainerModelImpl extends ResponsiveGrid implements EAEMPositioningContainerModel{
    @ScriptVariable
    private Resource resource;

    @PostConstruct
    protected void initModel() {
        super.initModel();
    }

    public Map<String, Object> getBackgroundProps(){
        Map<String, Object> backgroundDivProps = new LinkedHashMap<String, Object>();

        ValueMap vm = resource.getValueMap();
        String overlayOpacity = vm.get("overlayOpacity", "100");

        backgroundDivProps.put("backgroundHeight", vm.get("backgroundHeight", "500px"));
        backgroundDivProps.put("backgroundWidth", vm.get("backgroundWidth", "INSET"));
        backgroundDivProps.put("overlayOpacity", Float.parseFloat(overlayOpacity));
        backgroundDivProps.put("backgroundType", vm.get("backgroundType", "NONE"));
        backgroundDivProps.put("backgroundImage", vm.get("backgroundImage", ""));

        return backgroundDivProps;
    }

    public Map<String, Object> getSectionProps(){
        Map<String, Object> sectionProps = new LinkedHashMap<String, Object>();
        ValueMap vm = resource.getValueMap();

        sectionProps.put("sectionHeight", vm.get("sectionHeight", ""));
        sectionProps.put("contentWidth", vm.get("contentWidth", ""));
        sectionProps.put("sectionBGColor", vm.get("sectionBGColor", ""));
        sectionProps.put("contentAlignment", vm.get("contentAlignment", "Center"));

        return sectionProps;
    }
}
