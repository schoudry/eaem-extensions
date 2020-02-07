package apps.experienceaem.assets;

import com.day.cq.search.Predicate;
import com.day.cq.search.eval.AbstractPredicateEvaluator;
import com.day.cq.search.eval.EvaluationContext;
import org.apache.commons.lang3.StringUtils;
import org.osgi.service.component.annotations.Component;

@Component(
        factory = "com.day.cq.search.eval.PredicateEvaluator/eaemjcruuid"
)public class JcrUUIDPredicateEvaluator extends AbstractPredicateEvaluator {
    public String getXPathExpression(Predicate predicate, EvaluationContext context) {
        String value = predicate.get(predicate.getName());

        if(StringUtils.isEmpty(value)){
            return null;
        }

        return "(@jcr:uuid = '" + value + "')";
    }
}
