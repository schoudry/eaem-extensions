package apps.eaem.assets.core.models;


import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.InjectionStrategy;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

@Model(adaptables = Resource.class)
public class HelloWorldModel {

    @ValueMapValue(injectionStrategy=InjectionStrategy.OPTIONAL)
    protected String iconPath;

    private String iconName;

    @PostConstruct
    protected void init() {
        if(!StringUtils.isEmpty(iconPath)){
            iconName = iconPath.substring(iconPath.lastIndexOf("/") + 1, iconPath.lastIndexOf(".svg"));
        }
    }

    public String getIconName() {
        return iconName;
    }
}
