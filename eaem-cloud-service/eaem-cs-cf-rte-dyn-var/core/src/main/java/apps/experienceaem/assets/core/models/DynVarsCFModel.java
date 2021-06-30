package apps.experienceaem.assets.core.models;

import com.adobe.cq.dam.cfm.ContentElement;
import com.adobe.cq.dam.cfm.ContentFragment;
import com.adobe.cq.dam.cfm.FragmentData;
import com.day.cq.wcm.api.Page;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Optional;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import java.util.*;

@Model(
        adaptables = {SlingHttpServletRequest.class}
)
public class DynVarsCFModel {
    private static Logger log = LoggerFactory.getLogger(DynVarsCFModel.class);

    @Inject
    SlingHttpServletRequest request;

    @Inject
    Page currentPage;

    @ValueMapValue
    @Optional
    private String fragmentPath;

    @ValueMapValue
    @Optional
    private String cfSelectedFrom;

    private String variation;
    private Map<String,Object> modalData = new HashMap<String, Object>();

    @PostConstruct
    protected void init() {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;
        ResourceResolver resolver = slingRequest.getResourceResolver();

        Resource cfResource = null;
        variation = slingRequest.getParameter("variation");

        if(StringUtils.isEmpty(variation)){
            variation = "master";
        }

        if("URL".equals(cfSelectedFrom)){
            cfResource = slingRequest.getRequestPathInfo().getSuffixResource();
        }else if(StringUtils.isNotEmpty(fragmentPath)){
            cfResource = resolver.getResource(fragmentPath);
        }

        if(cfResource == null){
            return;
        }

        modalData = getCFData(cfResource.adaptTo(ContentFragment.class), resolver, currentPage.getProperties());
    }

    private Map<String,Object> getCFData(ContentFragment cf, ResourceResolver resolver, ValueMap pageProps){
        Map<String,Object> cfData = new HashMap<String, Object>();

        Iterator<ContentElement> cfElementsItr = cf.getElements();

        while(cfElementsItr.hasNext()){
            ContentElement cfElement = cfElementsItr.next();

            if(cfElement == null ){
                continue;
            }

            Object fragValue = getVariationValue(cfElement, variation).getValue();

            if(fragValue == null){
                continue;
            }else if(isMultiCF(cfElement)){
                List<Object> multis = new ArrayList<Object>();

                for(String linkPath : (String[])fragValue){
                    multis.add(getCFData(resolver.getResource(linkPath).adaptTo(ContentFragment.class), resolver, pageProps));
                }

                cfData.put(cfElement.getName(), multis);
            }else{
                cfData.put(cfElement.getName(), replaceDynVars(String.valueOf(fragValue), pageProps));
            }
        }

        return cfData;
    }

    private String replaceDynVars(String fragValue, ValueMap pageProps){
        Iterator<String> itr = pageProps.keySet().iterator();
        String key;

        while(itr.hasNext()){
            key = itr.next();

            if(!key.startsWith("dynVar")){
                continue;
            }

            fragValue = fragValue.replace("{{" + key.substring("dynVar".length()) + "}}", String.valueOf(pageProps.get(key)));
        }

        return fragValue;
    }

    private boolean isMultiCF(ContentElement cfElement){
        return cfElement.getValue().getDataType().isMultiValue();
    }

    public FragmentData getVariationValue(ContentElement cfElement, String variationName){
        if(StringUtils.isEmpty(variationName) || "master".equals(variationName)){
            return cfElement.getValue();
        }

        return cfElement.getVariation(variation).getValue();
    }

    public String getCfSelectedFrom() {
        return cfSelectedFrom;
    }

    public Map<String,Object> getModalData(){
        return modalData;
    }
}
