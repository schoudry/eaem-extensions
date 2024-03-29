package apps.experienceaem.sites.spa.core.filters;

import com.day.cq.search.PredicateGroup;
import com.day.cq.search.Query;
import com.day.cq.search.QueryBuilder;
import com.day.cq.search.result.Hit;
import com.day.cq.search.result.SearchResult;
import com.day.cq.wcm.api.policies.ContentPolicy;
import com.day.cq.wcm.api.policies.ContentPolicyManager;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.wrappers.SlingHttpServletResponseWrapper;
import org.apache.sling.commons.json.JSONArray;
import org.json.JSONObject;
import org.osgi.service.component.annotations.Component;
import org.osgi.framework.Constants;

import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.*;
import java.io.*;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM Default Sling Model Response Modifier Servlet Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=.*.model.json"
        }
)
public class EAEMDefaultModelJSONFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(EAEMDefaultModelJSONFilter.class);

    public static String EAEM_DATA = "eaemData";

    @Reference
    private QueryBuilder builder;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;

        String uri = slingRequest.getRequestURI();

        if(!uri.endsWith(".model.json")){
            chain.doFilter(request, response);
            return;
        }

        SlingHttpServletResponse modelResponse = new DefaultSlingModelResponseWrapper((SlingHttpServletResponse)response);

        chain.doFilter(slingRequest, modelResponse);

        PrintWriter responseWriter = response.getWriter();

        responseWriter.write(getModifiedContent(modelResponse.toString(), slingRequest));
    }

    private String getModifiedContent(String origContent, SlingHttpServletRequest slingRequest){
        String modifiedContent = origContent;

        try{
            JSONObject model = new JSONObject(origContent);

            model = (JSONObject) replaceEaemDataObject(model);

            modifiedContent = model.toString();
        }catch(Exception e){
            log.error("Error modifying model JSON content", e);
            modifiedContent = origContent;
        }

        return modifiedContent;
    }

    private Object replaceEaemDataObject(JSONObject jsonObject) throws Exception{
        Iterator<String> itr = jsonObject.keys();
        String key;

        JSONObject modJSONObj = new JSONObject();
        Object jsonValue = null;

        while(itr.hasNext()){
            key = itr.next();

            if(key.equals(EAEM_DATA)){
                JSONObject eaemData = (JSONObject)jsonObject.get(EAEM_DATA);

                eaemData.put(":type" , jsonObject.get(":type"));

                return eaemData;
            }else{
                jsonValue = jsonObject.get(key);

                if(JSONObject.class.isInstance(jsonValue)){
                    modJSONObj.put(key, replaceEaemDataObject((JSONObject)jsonValue));
                }else{
                    modJSONObj.put(key, jsonValue);
                }
            }
        }

        return modJSONObj;
    }

    @Override
    public void destroy() {
    }

    private class DefaultSlingModelResponseWrapper extends SlingHttpServletResponseWrapper {
        private CharArrayWriter writer;

        public DefaultSlingModelResponseWrapper (final SlingHttpServletResponse response) {
            super(response);
            writer = new CharArrayWriter();
        }

        public PrintWriter getWriter() throws IOException {
            return new PrintWriter(writer);
        }

        public String toString() {
            return writer.toString();
        }
    }
}
