package apps.eaem;

import com.day.cq.search.Predicate;
import com.day.cq.search.eval.EvaluationContext;
import com.day.cq.search.eval.JcrPropertyPredicateEvaluator;
import org.apache.commons.lang3.StringUtils;
import org.osgi.service.component.annotations.Component;

import java.io.StringWriter;

@Component(
        factory = "com.day.cq.search.eval.PredicateEvaluator/property"
)
public class PhotoshopPredicateEvaluator extends JcrPropertyPredicateEvaluator {
    private String DC_FORMAT_METADATA_PREFIX = "(jcr:content/metadata/@dc:format";
    private String PSD_MIME_TYPE = "'image/vnd.adobe.photoshop'";
    private String PSB_MIME_TYPE = "'application/vnd.3gpp.pic-bw-small'";

    public String getXPathExpression(Predicate p, EvaluationContext context) {
        String xPathExpr = super.getXPathExpression(p, context);

        if(StringUtils.isEmpty(xPathExpr) || !xPathExpr.startsWith(DC_FORMAT_METADATA_PREFIX)){
            return xPathExpr;
        }

        String value = xPathExpr.substring(xPathExpr.indexOf("=") + 1, xPathExpr.lastIndexOf(")"));

        if(!PSD_MIME_TYPE.equals(value.trim())){
            return xPathExpr;
        }

        StringWriter sw = new StringWriter();

        String firstExpr = xPathExpr.substring(0, xPathExpr.lastIndexOf(")"));

        sw.append(firstExpr).append(" or jcr:content/metadata/@dc:format = " + PSB_MIME_TYPE + ")");

        return sw.toString();
    }
}
