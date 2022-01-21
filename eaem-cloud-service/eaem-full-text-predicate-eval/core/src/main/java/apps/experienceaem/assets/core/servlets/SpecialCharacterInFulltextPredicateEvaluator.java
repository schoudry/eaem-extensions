package apps.experienceaem.assets.core.servlets;

import com.day.cq.search.Predicate;
import com.day.cq.search.eval.EvaluationContext;
import com.day.cq.search.eval.FulltextPredicateEvaluator;
import org.apache.commons.lang3.StringUtils;
import org.osgi.service.component.annotations.Component;

@Component(
        factory = "com.day.cq.search.eval.PredicateEvaluator/fulltext"
)
public class SpecialCharacterInFulltextPredicateEvaluator extends FulltextPredicateEvaluator {

    public String getXPathExpression(Predicate predicate, EvaluationContext context) {
        String searchTerm = predicate.get(predicate.getName());

        if(StringUtils.isEmpty(searchTerm) || !searchTerm.contains("_")){
            return super.getXPathExpression(predicate, context);
        }

        searchTerm = searchTerm.replace("_", " ");
        predicate.set("fulltext", searchTerm);

        return super.getXPathExpression(predicate, context);
    }
}