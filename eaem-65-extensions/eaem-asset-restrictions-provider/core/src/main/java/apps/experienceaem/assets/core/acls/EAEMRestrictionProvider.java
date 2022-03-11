package apps.experienceaem.assets.core.acls;

import com.google.common.collect.ImmutableMap;
import org.apache.jackrabbit.oak.api.PropertyState;
import org.apache.jackrabbit.oak.api.Tree;
import org.apache.jackrabbit.oak.api.Type;
import org.apache.jackrabbit.oak.spi.security.authorization.restriction.*;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component(
        service = RestrictionProvider.class
)
public class EAEMRestrictionProvider extends AbstractRestrictionProvider {
    private static final Logger log = LoggerFactory.getLogger(EAEMRestrictionProvider.class);

    public EAEMRestrictionProvider() {
        super(supportedRestrictions());
    }

    private static Map<String, RestrictionDefinition> supportedRestrictions() {
        RestrictionDefinition folderCategoryRes = new RestrictionDefinitionImpl(EAEMAssetCategoryRestriction.ASSET_CATEGORY,
                Type.STRING, false);
        return ImmutableMap.of(folderCategoryRes.getName(), folderCategoryRes);
    }

    @Override
    public RestrictionPattern getPattern(String oakPath, Tree tree) {
        if (oakPath == null) {
            return RestrictionPattern.EMPTY;
        } else {
            List<RestrictionPattern> patterns = new ArrayList(1);

            PropertyState folderCategoryProperty = tree.getProperty(EAEMAssetCategoryRestriction.ASSET_CATEGORY);

            if (folderCategoryProperty != null) {
                patterns.add(new EAEMAssetCategoryRestriction(folderCategoryProperty.getValue(Type.STRING)));
            }

            return CompositePattern.create(patterns);
        }
    }

    @Override
    public RestrictionPattern getPattern(String oakPath, Set<Restriction> restrictions) {
        if (oakPath == null || restrictions.isEmpty()) {
            return RestrictionPattern.EMPTY;
        } else {
            List<RestrictionPattern> patterns = new ArrayList(1);

            for (Restriction r : restrictions) {
                String name = r.getDefinition().getName();

                if (EAEMAssetCategoryRestriction.ASSET_CATEGORY.equals(name)) {
                    patterns.add(new EAEMAssetCategoryRestriction(r.getProperty().getValue(Type.STRING)));
                    break;
                }else {
                    log.debug("Ignoring unsupported restriction " + name);
                }
            }

            return CompositePattern.create(patterns);
        }
    }
}

