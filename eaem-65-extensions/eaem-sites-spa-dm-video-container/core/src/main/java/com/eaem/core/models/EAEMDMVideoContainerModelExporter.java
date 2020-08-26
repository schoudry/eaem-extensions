package com.eaem.core.models;

import com.adobe.cq.export.json.ContainerExporter;
import com.fasterxml.jackson.annotation.JsonInclude;

public interface EAEMDMVideoContainerModelExporter extends ContainerExporter {

    @JsonInclude
    public String getDmVideoPath();

    @JsonInclude
    public String getDmVideoEncode();
}
