package apps.eaem_most_popular_comp_query_based.eaem_most_popular_content_component;

import com.day.cq.wcm.api.Page;
import org.apache.sling.api.resource.ResourceResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobe.cq.sightly.WCMUsePojo;

import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

public class MostPopularQueryPojo extends WCMUsePojo {

    private static final Logger log = LoggerFactory.getLogger(MostPopularQueryPojo.class);

    private static String PAGE_VIEWS_LAST_30 = "showPageViews30";

    private Map<String, String> contentPaths = new LinkedHashMap<>();

    @Override
    public void activate() {
        String pageViews = getProperties().get(PAGE_VIEWS_LAST_30, "last30Days");

        ResourceResolver resolver = getResourceResolver();

        try{
            QueryManager qm = resolver.adaptTo(javax.jcr.Session.class).getWorkspace().getQueryManager();

            if(qm == null){
                return;
            }

            String stmt = "SELECT * FROM [cq:Page] where ISDESCENDANTNODE(\"/content/we-retail/language-masters\") " +
                            "order by [jcr:content/cq:meta/" + pageViews + "/analytics_pageviews] desc";
            Query q = qm.createQuery(stmt, Query.JCR_SQL2);

            q.setLimit(10);

            NodeIterator results = q.execute().getNodes();
            Node node = null;
            Page page = null;

            while(results.hasNext()){
                node = (Node)results.next();
                page = resolver.getResource(node.getPath()).adaptTo(Page.class);

                contentPaths.put(page.getPath(), page.getTitle());
            }
        }catch(Exception e){
            log.error("Error - ", e);
        }
    }

    public Map<String, String> getContentPaths() {
        return contentPaths;
    }
}
