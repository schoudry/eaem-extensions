package apps.experienceaem.sites.core;

import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.PageInfoProvider;
import org.apache.commons.lang.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.commons.json.JSONException;
import org.apache.sling.commons.json.JSONObject;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Component(
        service = PageInfoProvider.class,
        immediate = true,
        name = "Experience AEM - Component Count Page Info Provider",
        property = {
                "pageInfoProviderType=sites.listView.info.provider." + ComponentCountPageInfoProvider.PROVIDER_TYPE
        }
)
public class ComponentCountPageInfoProvider implements PageInfoProvider{
    public static final String PROVIDER_TYPE = "experienceaem";
    public static final String PROVIDER_PROP_COMP_COUNT = "componentsCount";
    private static final String SLING_RES_TYPE = "sling:resourceType";

    @Override
    public void updatePageInfo(SlingHttpServletRequest slingRequest, JSONObject info, Resource resource)
                        throws JSONException {
        List<String> compPaths = new ArrayList<String>();

        readAllComponents(resource.getChild("jcr:content"), compPaths);

        JSONObject componentsCountJson = new JSONObject();
        componentsCountJson.put(PROVIDER_PROP_COMP_COUNT, compPaths.size());

        info.put(PROVIDER_TYPE, componentsCountJson);
    }

    private void readAllComponents(Resource resource, List<String> compPaths){
        Iterator<Resource> componentsItr = resource.listChildren();

        while(componentsItr.hasNext()){
            Resource childRes = componentsItr.next();
            ValueMap vm = childRes.getValueMap();

            if(StringUtils.isEmpty(vm.get(SLING_RES_TYPE, String.class))){
                continue;
            }

            compPaths.add(childRes.getPath());

            readAllComponents(childRes, compPaths);
        }
    }
}
