package apps.experienceaem.pe;

import com.day.cq.search.Predicate;
import com.day.cq.search.eval.AbstractPredicateEvaluator;
import com.day.cq.search.eval.EvaluationContext;
import org.apache.felix.scr.annotations.Component;
import org.apache.sling.api.resource.ValueMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.query.Row;
import java.util.*;

@Component(metatype = false, factory = "com.day.cq.search.eval.PredicateEvaluator/eaem-ignore-case")
public class CaseInsensitiveOrderByPredicate extends AbstractPredicateEvaluator {
    private static final Logger logger = LoggerFactory.getLogger(CaseInsensitiveOrderByPredicate.class);

    public static final String PROPERTY = "property";

    public String[] getOrderByProperties(Predicate p, EvaluationContext context) {
        Map<String, String> paramMap = p.getParameters();
        List<String> orderProps = new ArrayList<String>();

        for(String param : paramMap.values()){
            orderProps.add("fn:upper-case(" + param + ")");
        }

        return orderProps.toArray(new String[0]);
    }

    /**
     * can be used for further ordering, or scenarios where getOrderByProperties() isn't enough
     *
     * @param predicate
     * @param context
     * @return
     */
    /*public Comparator<Row> getOrderByComparator(final Predicate predicate, final EvaluationContext context) {
        return new Comparator<Row>() {
            public int compare(Row r1, Row r2) {
                int ret = 1;

                if ((r1 == null) || (r2 == null) || (predicate.get(PROPERTY) == null)) {
                    return ret;
                }

                try {
                    ValueMap valueMap1 = context.getResource(r1).adaptTo(ValueMap.class);
                    ValueMap valueMap2 = context.getResource(r2).adaptTo(ValueMap.class);

                    String property1 = valueMap1.get(predicate.get(PROPERTY), "");
                    String property2 = valueMap2.get(predicate.get(PROPERTY), "");

                    ret = property1.compareToIgnoreCase(property2);
                } catch (Exception e) {
                    logger.error(e.getMessage());
                }

                return ret;
            }
        };
    }*/
}
