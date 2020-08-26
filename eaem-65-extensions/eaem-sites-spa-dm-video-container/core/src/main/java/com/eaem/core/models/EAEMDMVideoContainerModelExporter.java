package com.eaem.core.models;

import com.adobe.cq.export.json.ContainerExporter;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

public interface EAEMDMVideoContainerModelExporter extends ContainerExporter {

    @JsonInclude
    public String getDmVideoPath();

    @JsonInclude
    public String getDmVideoEncode();

    @JsonInclude
    public String getDmServerUrl();

    @JsonInclude
    public String getDmVideoViewerPath();

    @JsonInclude
    public String getDmVideoServerUrl();

    @JsonInclude
    public Map<String, String> getOverlayDivStyle();

}
