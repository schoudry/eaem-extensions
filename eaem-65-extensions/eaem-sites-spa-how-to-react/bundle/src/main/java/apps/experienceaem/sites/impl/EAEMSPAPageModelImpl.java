package apps.experienceaem.sites.impl;

import apps.experienceaem.sites.EAEMSPAPageModel;
import com.adobe.cq.export.json.ComponentExporter;
import com.adobe.cq.export.json.ContainerExporter;
import com.adobe.cq.export.json.ExporterConstants;
import com.adobe.cq.export.json.SlingModelFilter;
import com.adobe.cq.export.json.hierarchy.HierarchyNodeExporter;
import com.adobe.cq.export.json.hierarchy.type.HierarchyTypes;
import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.TemplatedResource;
import com.day.cq.wcm.api.components.ComponentContext;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.factory.ModelFactory;

import javax.inject.Inject;
import java.util.*;

@Model(
    adaptables = SlingHttpServletRequest.class,
    adapters = {
            EAEMSPAPageModel.class,
            ContainerExporter.class
    },
    resourceType = EAEMSPAPageModelImpl.RESOURCE_TYPE )
@Exporter(
        name = ExporterConstants.SLING_MODEL_EXPORTER_NAME,
        extensions = ExporterConstants.SLING_MODEL_EXTENSION )
public class EAEMSPAPageModelImpl implements EAEMSPAPageModel {
    protected static final String RESOURCE_TYPE = "eaem-sites-spa-how-to-react/components/page";
    private static final String COMPONENT_CONTEXT_ATTR = "com.day.cq.wcm.componentcontext";
    private static final String CURRENT_PAGE_ATTR = "currentPage";

    @ScriptVariable
    protected Page currentPage;

    @Self
    private SlingHttpServletRequest request;

    @Inject
    private SlingModelFilter slingModelFilter;

    @Inject
    private ModelFactory modelFactory;

    private Map<String, ComponentExporter> childModels = null;

    private Map<String, EAEMSPAPageModel> childPages = null;

    public String getTitle() {
        return currentPage.getPageTitle();
    }

    public String getRootUrl() {
        return request.getContextPath() + currentPage.getPath() + ".model.json";
    }

    public EAEMSPAPageModel getRootModel() {
        return this;
    }

    public String getExportedHierarchyType() {
        return HierarchyTypes.PAGE;
    }

    public String getExportedPath() {
        return currentPage.getPath();
    }

    public String getExportedType() {
        return currentPage.getContentResource().getResourceType();
    }

    public Map<String, ? extends ComponentExporter> getExportedItems() {
        if (childModels != null) {
            return childModels;
        }

        childModels = new LinkedHashMap<String, ComponentExporter>();

        Iterable<Resource> iterable = slingModelFilter.filterChildResources(request.getResource().getChildren());

        if (iterable == null) {
            return childModels;
        }

        for (final Resource child : iterable) {
            childModels.put(child.getName(), modelFactory.getModelFromWrappedRequest(request, child, ComponentExporter.class));
        }

        return childModels;
    }

    public String[] getExportedItemsOrder() {
        Map<String, ? extends ComponentExporter> models = getExportedItems();

        if (models.isEmpty()) {
            return ArrayUtils.EMPTY_STRING_ARRAY;
        }

        return models.keySet().toArray(ArrayUtils.EMPTY_STRING_ARRAY);
    }

    public Map<String, ? extends HierarchyNodeExporter> getExportedChildren() {
        if (childPages != null) {
            return childPages;
        }

        int DEPTH = 3; // or get it from /conf/<project>/settings/wcm/policies/wcm/foundation/components/page/policy_xxx@structureDepth

        SlingHttpServletRequest requestWrapper = new SlingHttpServletRequestWrapper(request);

        childPages = new LinkedHashMap<String, EAEMSPAPageModel>();

        List<Page> pages = getChildPageRecursive(currentPage, requestWrapper, DEPTH);

        for (Page page: pages) {
            Resource contentResource = page.getContentResource();

            TemplatedResource templatedResource = contentResource.adaptTo(TemplatedResource.class);

            if (templatedResource != null) {
                contentResource = templatedResource;
            }

            childPages.put(page.getPath(),
                    modelFactory.getModelFromWrappedRequest(getHierarchyServletRequest(requestWrapper, page), contentResource, EAEMSPAPageModel.class));
        }


        return childPages;
    }

    private SlingHttpServletRequest getHierarchyServletRequest(SlingHttpServletRequest request, Page eaemPage) {
        SlingHttpServletRequest wrapper = new SlingHttpServletRequestWrapper(request);

        ComponentContext componentContext = (ComponentContext) request.getAttribute(COMPONENT_CONTEXT_ATTR);

        wrapper.setAttribute(COMPONENT_CONTEXT_ATTR, new EAEMSPAComponentRequestWrapper(componentContext, eaemPage));
        wrapper.setAttribute(CURRENT_PAGE_ATTR, eaemPage);

        return wrapper;
    }


    private List<Page> getChildPageRecursive(Page page, SlingHttpServletRequest slingRequest, int depth) {
        List<Page> pages = new ArrayList<Page>();
        Iterator<Page> childItr = page.listChildren();

        depth--;

        while (childItr.hasNext()) {
            Page childPage = childItr.next();

            // assuming all pages under a parent are part of SPA, otherwise get the page pattern from
            // /conf/<project>/settings/wcm/policies/wcm/foundation/components/page/policy_xxx@structurePatterns
            pages.add(childPage);

            pages.addAll(getChildPageRecursive(childPage, slingRequest, depth));
        }

        return pages;
    }
}
