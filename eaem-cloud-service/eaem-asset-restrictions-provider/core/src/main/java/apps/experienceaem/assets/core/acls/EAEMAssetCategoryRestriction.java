package apps.experienceaem.assets.core.acls;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.JcrConstants;
import org.apache.jackrabbit.oak.api.PropertyState;
import org.apache.jackrabbit.oak.api.Tree;
import org.apache.jackrabbit.oak.api.Type;
import org.apache.jackrabbit.oak.spi.security.authorization.restriction.RestrictionPattern;

public class EAEMAssetCategoryRestriction  implements RestrictionPattern {
    private final String restrictedValue;
    public static final String ASSET_CATEGORY = "assetCategory";

    EAEMAssetCategoryRestriction(String restrictedValue) {
        this.restrictedValue = restrictedValue;
    }

    public boolean matches(Tree tree, PropertyState propertyState) {
        PropertyState property = tree.getChild(JcrConstants.JCR_CONTENT).getChild("metadata").getProperty(ASSET_CATEGORY);

        if(property == null){
            if(restrictedValue.equals("EMPTY")){
                return true;
            }
            return false;
        }

        String value = property.getValue(Type.STRING);

        if(restrictedValue.equals("EMPTY") && StringUtils.isEmpty(value)){
            return true;
        }

        return restrictedValue.equalsIgnoreCase(value);
    }

    public boolean matches(String path) {
        return false;
    }

    public boolean matches() {
        return false;
    }
}

