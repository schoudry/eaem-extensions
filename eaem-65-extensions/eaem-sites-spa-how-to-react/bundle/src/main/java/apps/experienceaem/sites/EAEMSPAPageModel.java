package apps.experienceaem.sites;

import com.adobe.cq.export.json.ContainerExporter;
import com.adobe.cq.export.json.hierarchy.HierarchyNodeExporter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

public interface EAEMSPAPageModel extends HierarchyNodeExporter, ContainerExporter {

    @JsonProperty("title")
    public String getTitle();

    @JsonIgnore
    public String getRootUrl();

    @JsonIgnore
    public EAEMSPAPageModel getRootModel();
}
