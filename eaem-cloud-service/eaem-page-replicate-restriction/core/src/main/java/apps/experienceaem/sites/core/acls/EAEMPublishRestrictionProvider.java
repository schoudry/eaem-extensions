package apps.experienceaem.sites.core.acls;

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
public class EAEMPublishRestrictionProvider extends AbstractRestrictionProvider {
    private static final Logger log = LoggerFactory.getLogger(EAEMPublishRestrictionProvider.class);

    public EAEMPublishRestrictionProvider() {
        super(supportedRestrictions());
    }

    private static Map<String, RestrictionDefinition> supportedRestrictions() {
        RestrictionDefinition embargoRes = new RestrictionDefinitionImpl(EAEMEmbargoTypeRestriction.RESTRICTION_TYPE_EMBARGO,
                Type.STRING, false);
        return ImmutableMap.of(embargoRes.getName(), embargoRes);
    }

    @Override
    public RestrictionPattern getPattern(String oakPath, Tree tree) {
        if (oakPath == null) {
            return RestrictionPattern.EMPTY;
        } else {
            List<RestrictionPattern> patterns = new ArrayList(1);

            PropertyState embargoProperty = tree.getProperty(EAEMEmbargoTypeRestriction.RESTRICTION_TYPE_EMBARGO);

            if (embargoProperty != null) {
                patterns.add(new EAEMEmbargoTypeRestriction(embargoProperty.getValue(Type.STRING)));
            }

            return CompositePattern.create(patterns);
        }
    }

    @Override
    public RestrictionPattern getPattern(String oakPath, Set<Restriction> restrictions) {
        if (oakPath == null || restrictions.isEmpty()) {
            return RestrictionPattern.EMPTY;
        } else {
            List<RestrictionPattern> patterns = new ArrayList(2);

            for (Restriction r : restrictions) {
                String name = r.getDefinition().getName();

                if (EAEMEmbargoTypeRestriction.RESTRICTION_TYPE_EMBARGO.equals(name)) {
                    patterns.add(new EAEMEmbargoTypeRestriction(r.getProperty().getValue(Type.STRING)));
                } else {
                    log.info("EAEMPublishRestrictionProvider : Ignoring unsupported restriction " + name);
                }
            }

            return CompositePattern.create(patterns);
        }
    }
}
