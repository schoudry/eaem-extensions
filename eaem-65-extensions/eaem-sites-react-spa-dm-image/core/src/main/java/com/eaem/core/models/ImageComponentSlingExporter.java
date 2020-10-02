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
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import java.util.Iterator;
import java.util.LinkedHashMap;
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
public class ImageComponentSlingExporter implements ComponentExporter {

    @Inject
    private Resource resource;

    @ValueMapValue
    private String imageLink;

    @ValueMapValue
    private String fileReference;

    @ValueMapValue
    private boolean openInNewWindow;

    private Map<String, String> smartCrops;

    @PostConstruct
    protected void initModel() {
        smartCrops = new LinkedHashMap<String, String>();

        Resource cropsRes = resource.getChild("crops");

        if(cropsRes == null){
            return;
        }

        Iterator<Resource> itr = cropsRes.listChildren();
        ValueMap vm = null;

        while(itr.hasNext()){
            vm = itr.next().getValueMap();
            smartCrops.put(vm.get("breakpoint", ""), vm.get("url", ""));
        }
    }

    @Override
    public String getExportedType() {
        return resource.getResourceType();
    }

    public Map<String, String> getSmartCrops() {
        return smartCrops;
    }

    public String getImageLink() {
        return imageLink;
    }

    public void setImageLink(String imageLink) {
        this.imageLink = imageLink;
    }

    public String getFileReference() {
        return fileReference;
    }

    public void setFileReference(String fileReference) {
        this.fileReference = fileReference;
    }

    public boolean isOpenInNewWindow() {
        return openInNewWindow;
    }

    public void setOpenInNewWindow(boolean openInNewWindow) {
        this.openInNewWindow = openInNewWindow;
    }
}
