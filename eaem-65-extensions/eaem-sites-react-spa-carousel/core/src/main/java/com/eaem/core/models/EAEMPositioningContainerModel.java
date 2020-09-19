package com.eaem.core.models;

import com.adobe.cq.export.json.ContainerExporter;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

public interface EAEMPositioningContainerModel extends ContainerExporter {

    @JsonInclude
    public Map<String, Object> getBackgroundProps();

    @JsonInclude
    public Map<String, Object> getSectionProps();
}
