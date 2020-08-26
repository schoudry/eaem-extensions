package com.eaem.core.models;

import com.adobe.cq.export.json.ContainerExporter;

/**
 * Created by nalabotu on 8/26/2020.
 */
public interface EAEMDMVideoContainerModelExporter extends ContainerExporter {
    public String getDMVideoPath();
}
