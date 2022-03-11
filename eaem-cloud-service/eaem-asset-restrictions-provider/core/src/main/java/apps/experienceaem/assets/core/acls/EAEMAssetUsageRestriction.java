package apps.experienceaem.assets.core.acls;

import org.apache.jackrabbit.JcrConstants;
import org.apache.jackrabbit.oak.api.PropertyState;
import org.apache.jackrabbit.oak.api.Tree;
import org.apache.jackrabbit.oak.api.Type;
import org.apache.jackrabbit.oak.spi.security.authorization.restriction.RestrictionPattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EAEMAssetUsageRestriction implements RestrictionPattern {
    private static final Logger log = LoggerFactory.getLogger(EAEMAssetUsageRestriction.class);

    private final String usageValue;
    public static final String ASSET_USAGE = "assetUsage";

    EAEMAssetUsageRestriction(String usageValue) {
        this.usageValue = usageValue;
    }

    public boolean matches(Tree tree, PropertyState propertyState) {
        PropertyState property = tree.getChild(JcrConstants.JCR_CONTENT).getChild("metadata").getProperty(ASSET_USAGE);

        if(property == null){
            return false;
        }

        String value = property.getValue(Type.STRING);

        return usageValue.equalsIgnoreCase(value);
    }

    public boolean matches(String path) {
        return false;
    }

    public boolean matches() {
        return false;
    }
}
