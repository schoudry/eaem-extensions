package com.eaem.core.models.impl;

import com.adobe.cq.export.json.ContainerExporter;
import com.day.cq.dam.api.Asset;
import com.day.cq.wcm.foundation.model.responsivegrid.ResponsiveGrid;
import com.eaem.core.models.EAEMDMVideoContainerModelExporter;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import com.adobe.cq.export.json.ComponentExporter;

import javax.annotation.PostConstruct;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.InjectionStrategy;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

import java.util.HashMap;
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

    private Map<String, Object> metadata;

    @PostConstruct
    protected void initModel() {
        if( (this.resource == null) || StringUtils.isEmpty(eaemDMVideo)) {
            return;
        }

        ResourceResolver resolver = this.resource.getResourceResolver();
        Resource videoRes = resolver.getResource(eaemDMVideo);

        if(videoRes == null){
            return;
        }

        metadata = videoRes.adaptTo(Asset.class).getMetadata();
    }

    public String getDmAccountName(){
        if(metadata == null){
            return "";
        }

        String fileName = String.valueOf(metadata.get("dam:scene7File"));

        if(StringUtils.isEmpty(fileName)){
            return "";
        }

        return fileName.substring(0, fileName.indexOf("/"));
    }

    public String getDmServerUrl() {
        if(metadata == null){
            return "";
        }

        return metadata.get("dam:scene7Domain") + "is/image/";
    }

    public String getDmVideoViewerPath() {
        if(metadata == null){
            return "";
        }

        return metadata.get("dam:scene7Domain") + "s7viewers/html5/js/VideoViewer.js";
    }

    public String getDmVideoServerUrl() {
        if(metadata == null){
            return "";
        }

        return metadata.get("dam:scene7Domain") + "is/content/";
    }

    public Map<String, String> getOverlayDivStyle() {
        Map<String, String> divStyles = new HashMap<String, String>();
        ValueMap vm = this.resource.getValueMap();

        divStyles.put("top" , vm.get("overlayTop", ""));
        divStyles.put("left" , vm.get("overlayLeft", ""));
        divStyles.put("backgroundColor" , vm.get("overlayBGColor", "#FFFFFF"));
        divStyles.put("padding" , vm.get("overlayPadding", "10px 20px 10px 20px"));

        return divStyles;
    }

    public String getDmVideoPath() {
        return eaemDMVideo;
    }

    public String getDmVideoEncode() {
        return getDmAccountName() + "/" + eaemDMEncode;
    }
}
