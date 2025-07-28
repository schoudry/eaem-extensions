package apps.experienceaem.sites.core.acls;

import org.apache.jackrabbit.JcrConstants;
import org.apache.jackrabbit.oak.api.PropertyState;
import org.apache.jackrabbit.oak.api.Tree;
import org.apache.jackrabbit.oak.api.Type;
import org.apache.jackrabbit.oak.spi.security.authorization.restriction.RestrictionPattern;

public class EAEMEmbargoTypeRestriction implements RestrictionPattern {
    private final String restrictedValue;
    public static final String RESTRICTION_TYPE_EMBARGO = "embargoedContent";

    EAEMEmbargoTypeRestriction(String restrictedValue) {
        this.restrictedValue = restrictedValue;
    }

    public boolean matches(Tree tree, PropertyState propertyState) {
        Tree child = tree.getChild(JcrConstants.JCR_CONTENT);

        if(!child.hasProperty(RESTRICTION_TYPE_EMBARGO)){
            return false;
        }

        String value = child.getProperty(RESTRICTION_TYPE_EMBARGO).getValue(Type.STRING);

        return restrictedValue.equalsIgnoreCase(value);
    }

    public boolean matches(String path) {
        return false;
    }

    public boolean matches() {
        return false;
    }
}
