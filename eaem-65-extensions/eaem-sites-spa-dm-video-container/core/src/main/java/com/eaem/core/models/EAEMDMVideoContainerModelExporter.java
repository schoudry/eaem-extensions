package com.eaem.core.models;

import com.adobe.cq.export.json.ContainerExporter;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Created by nalabotu on 8/26/2020.
 */
public interface EAEMDMVideoContainerModelExporter extends ContainerExporter {

    @JsonInclude
    public String getDMVideoPath();
}
