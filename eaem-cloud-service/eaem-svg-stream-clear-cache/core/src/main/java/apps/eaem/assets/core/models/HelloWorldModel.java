/*
 *  Copyright 2015 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package apps.eaem.assets.core.models;


import javax.annotation.PostConstruct;

import com.adobe.xfa.ut.StringUtils;
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
