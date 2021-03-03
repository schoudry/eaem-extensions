package apps.experienceaem.assets.core.filters;

import com.day.cq.search.PredicateGroup;
import com.day.cq.search.Query;
import com.day.cq.search.QueryBuilder;
import com.day.cq.search.result.Hit;
import com.day.cq.search.result.SearchResult;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.request.RequestParameter;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.servlet.*;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM DAM server side duplicate file name check",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=((.*.initiateUpload.json)|(.*.createasset.html))",
        }
)
public class DuplicateAssetNameCheck implements Filter {
    private static Logger log = LoggerFactory.getLogger(DuplicateAssetNameCheck.class);

    private static String INITIATE_UPLOAD_JSON = ".initiateUpload.json";
    private static String CREATE_ASSET_HTML = ".createasset.html";
    private static final String EAEM_SERVICE_USER = "eaem-service-user";

    @Reference
    private ResourceResolverFactory factory;

    @Reference
    private QueryBuilder builder;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try{
            SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;
            SlingHttpServletResponse slingResponse = (SlingHttpServletResponse)response;

            String uri = slingRequest.getRequestURI();

            if(!uri.endsWith(INITIATE_UPLOAD_JSON) && !uri.endsWith(CREATE_ASSET_HTML)){
                chain.doFilter(request, response);
                return;
            }

            /*String userAgent = slingRequest.getHeader("User-Agent");

            if(isBrowser(userAgent)){
                //duplicate filename check in browsers is already done on client side
                log.info("A Browser User agent : " + userAgent);
                chain.doFilter(request, response);
                return;
            }*/

            String fileNames[] = request.getParameterValues("fileName");

            if(fileNames == null){
                RequestParameter params[] = slingRequest.getRequestParameters("file");

                if(ArrayUtils.isEmpty(params)){
                    log.warn("Skipping duplicate check, 'fileName' and 'file' params, both are empty");
                    chain.doFilter(request, response);
                    return;
                }

                for (final RequestParameter param : params) {
                    if (param.getFileName() == null) {
                        continue;
                    }

                    fileNames = new String[1];
                    fileNames[0] = param.getFileName();

                    break;
                }
            }

            if(ArrayUtils.isEmpty(fileNames)){
                log.warn("Skipping duplicate check, 'fileName' and 'file' params, both are empty");
                chain.doFilter(request, response);
                return;
            }

            List<String> duplicatePaths = getDuplicateFilePaths(factory, builder, fileNames);

            log.info("duplicatePaths : " + duplicatePaths + ", for file : " +  String.join(",", fileNames));

            if(!CollectionUtils.isEmpty(duplicatePaths)){
                log.info("Duplicate file names detected while upload : " + duplicatePaths);
                slingResponse.sendError(SlingHttpServletResponse.SC_FORBIDDEN, "Duplicates found: " + String.join(",", duplicatePaths));
                return;
            }

            chain.doFilter(request, response);
        }catch(Exception e){
            log.error("Error checking for duplicates", e);
        }
    }

    public static List<String> getDuplicateFilePaths(ResourceResolverFactory resourceResolverFactory,
                                                     QueryBuilder builder, String fileNames[]) throws RepositoryException {
        ResourceResolver resourceResolver = getServiceResourceResolver(resourceResolverFactory);
        List<String> duplicates = new ArrayList<String>();

        Query query = builder.createQuery(PredicateGroup.create(getQueryPredicateMap(fileNames)), resourceResolver.adaptTo(Session.class));

        SearchResult result = query.getResult();

        for (Hit hit : result.getHits()) {
            duplicates.add(hit.getPath());
        }

        return duplicates;
    }

    private static Map<String, String> getQueryPredicateMap(String[] fileNames) {
        Map<String, String> map = new HashMap<>();
        map.put("path", "/content/dam");
        map.put("type", "dam:Asset");
        map.put("group.p.or", "true");

        for(int index = 0; index < fileNames.length; index++){
            map.put("group." + index + "_nodename", fileNames[index]);
        }

        return map;
    }

    public static ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            log.error("Could not login as SubService user {}, exiting SearchService service.", EAEM_SERVICE_USER, ex);
            return null;
        }
    }

    private boolean isBrowser(String userAgent){
        return (userAgent.contains("Mozilla") || userAgent.contains("Chrome") || userAgent.contains("Safari"));
    }

    @Override
    public void destroy() {
    }
}
