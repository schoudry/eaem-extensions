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

    public Map<String, String> getBackgroundProps(){
        Map<String, String> backgroundDivProps = new LinkedHashMap<String, String>();
        ValueMap vm = resource.getValueMap();

        backgroundDivProps.put("backgroundWidth", vm.get("backgroundWidth", "INSET"));
        backgroundDivProps.put("overlayOpacity", vm.get("overlayOpacity", "100"));
        backgroundDivProps.put("backgroundType", vm.get("backgroundType", "NONE"));
        backgroundDivProps.put("backgroundImage", vm.get("backgroundImage", "NONE"));

        return backgroundDivProps;
    }

    public Map<String, String> getSectionProps(){
        Map<String, String> sectionProps = new LinkedHashMap<String, String>();
        ValueMap vm = resource.getValueMap();

        sectionProps.put("backgroundWidth", vm.get("backgroundWidth", "INSET"));
        sectionProps.put("overlayOpacity", vm.get("overlayOpacity", "100"));
        sectionProps.put("backgroundType", vm.get("backgroundType", "NONE"));
        sectionProps.put("backgroundImage", vm.get("backgroundImage", "NONE"));

        return sectionProps;
    }
}
