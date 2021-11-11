package apps.experienceaem.sites.core.filters;

import org.apache.jackrabbit.oak.spi.security.authentication.JaasLoginContext;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.wrappers.SlingHttpServletResponseWrapper;
import org.apache.sling.commons.json.JSONObject;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.CharArrayWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM - SPA Page Include Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=.*.model.json"
        }
)
public class SPAPageIncludeFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(SPAPageIncludeFilter.class);

    private static final String MODEL_INCLUDE_COMPONENT = "eaem-spa-page-include/components/spa-include";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void destroy() {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try {
            SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;

            String uri = slingRequest.getRequestURI();

            if (!uri.endsWith(".model.json")) {
                chain.doFilter(request, response);
                return;
            }

            SlingHttpServletResponse modelResponseWrapper = new DefaultSlingModelResponseWrapper((SlingHttpServletResponse)response);

            chain.doFilter(slingRequest, modelResponseWrapper);

            PrintWriter responseWriter = response.getWriter();

            String modelResponse = modelResponseWrapper.toString();

            try{
                modelResponse = lookThroughModelForSPAIncludes(new JSONObject(modelResponse), slingRequest,
                                        (SlingHttpServletResponse) response).toString();
            }catch(Exception me){
                log.warn("Error replacing SPA Page includes", me);
            }

            responseWriter.write(modelResponse);
        } catch (ServletException e) {
            throw new ServletException("Error including spa page models", e);
        }
    }

    private Object lookThroughModelForSPAIncludes(JSONObject jsonObject, SlingHttpServletRequest slingRequest,
                                         SlingHttpServletResponse slingResponse) throws Exception {
        Iterator<String> itr = jsonObject.keys();
        String key;

        JSONObject modJSONObj = new JSONObject();
        Object jsonValue = null;

        while (itr.hasNext()) {
            key = itr.next();

            if (key.equals(":type")) {
                String typeValue = jsonObject.getString(key);

                if(typeValue.equals(MODEL_INCLUDE_COMPONENT) && jsonObject.has("pagePath")){
                    return getModelOfIncludedPage(jsonObject.getString("pagePath"), slingRequest, slingResponse);
                }else{
                    modJSONObj.put(key, typeValue);
                }
            } else {
                jsonValue = jsonObject.get(key);

                if (JSONObject.class.isInstance(jsonValue)) {
                    modJSONObj.put(key, lookThroughModelForSPAIncludes((JSONObject) jsonValue, slingRequest, slingResponse));
                } else {
                    modJSONObj.put(key, jsonValue);
                }
            }
        }

        return modJSONObj;
    }

    private JSONObject getModelOfIncludedPage(String includePageModelPath, SlingHttpServletRequest slingRequest,
                                              SlingHttpServletResponse slingResponse) throws Exception {
        RequestDispatcher dp = slingRequest.getRequestDispatcher(includePageModelPath + "/jcr:content/root/responsivegrid.model.json");

        SlingHttpServletResponse wrapperResponse = new DefaultSlingModelResponseWrapper(slingResponse);

        dp.include(slingRequest, wrapperResponse);

        String includedPageJSON = wrapperResponse.toString();

        return new JSONObject(includedPageJSON);
    }


    private class DefaultSlingModelResponseWrapper extends SlingHttpServletResponseWrapper {
        private CharArrayWriter writer;

        public DefaultSlingModelResponseWrapper(final SlingHttpServletResponse response) {
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
