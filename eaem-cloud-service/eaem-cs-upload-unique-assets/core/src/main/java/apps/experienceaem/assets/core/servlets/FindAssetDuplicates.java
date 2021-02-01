package apps.experienceaem.assets.core.servlets;

import com.day.cq.search.PredicateGroup;
import com.day.cq.search.Query;
import com.day.cq.search.QueryBuilder;
import com.day.cq.search.result.Hit;
import com.day.cq.search.result.SearchResult;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONArray;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component(
        name = "Disney Parks Vision DAM find duplicates servlet",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=GET",
                "sling.servlet.paths=/bin/dp-vision-dam/duplicates"
        }
)
public class FindAssetDuplicates extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(FindAssetDuplicates.class);

    private static final String EAEM_SERVICE_USER = "eaem-service-user";

    @Reference
    private ResourceResolverFactory factory;

    @Reference
    private QueryBuilder builder;

    @Override
    protected final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
            ServletException, IOException {
        try {
            String fileNames[] = request.getParameterValues("fileName");
            JSONArray duplicates = new JSONArray();

            response.setContentType("application/json");

            if(ArrayUtils.isEmpty(fileNames)){
                duplicates.write(response.getWriter());
                return;
            }

            ResourceResolver resourceResolver = getServiceResourceResolver(factory);

            Query query = builder.createQuery(PredicateGroup.create(getQueryPredicateMap(fileNames)),
                                        resourceResolver.adaptTo(Session.class));

            SearchResult result = query.getResult();

            for (Hit hit : result.getHits()) {
                duplicates.put(hit.getPath());
            }

            duplicates.write(response.getWriter());
        } catch (Exception e) {
            log.error("Could not execute duplicates check", e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    public ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            log.error("Could not login as SubService user {}, exiting SearchService service.", "disney-user-admin", ex);
            return null;
        }
    }

    private Map<String, String> getQueryPredicateMap(String[] fileNames) {
        Map<String, String> map = new HashMap<>();
        map.put("path", "/content/dam");
        map.put("group.p.or", "true");

        for(int index = 0; index < fileNames.length; index++){
            map.put("group." + index + "_nodename", fileNames[index]);
        }

        return map;
    }
}
