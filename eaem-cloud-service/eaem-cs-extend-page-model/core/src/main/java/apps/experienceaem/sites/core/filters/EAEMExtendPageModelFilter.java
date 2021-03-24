package apps.experienceaem.sites.core.filters;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
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
        name = "Expereince AEM Sling Model Response Modifier Servlet Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=.*.model.json"
        }
)
public class EAEMExtendPageModelFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(EAEMExtendPageModelFilter.class);

    private static final String SLING_VANITYPATH = "sling:vanityPath";
    private static final String SLING_VANITYPATH_JSON_PROP = "eaemVanityPath";
    private static final String CHILDREN = ":children";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try{
            SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;

            String uri = slingRequest.getRequestURI();

            if(!uri.endsWith(".model.json")){
                chain.doFilter(request, response);
                return;
            }

            SlingHttpServletResponse modelResponse = getModelResponse((SlingHttpServletResponse) response);

            chain.doFilter(slingRequest, modelResponse);

            PrintWriter responseWriter = response.getWriter();

            responseWriter.write(getModifiedContent(modelResponse.toString(), slingRequest));
        }catch(ServletException e){
            throw new ServletException("Error at EAEMExtendPageModelFilter.this.doFilter()");
        }
    }

    SlingHttpServletResponse getModelResponse(SlingHttpServletResponse response) {
        SlingHttpServletResponse modelResponse = new DefaultSlingModelResponseWrapper(response);
        return modelResponse;
    }

    private String getModifiedContent(String origContent, SlingHttpServletRequest slingRequest){
        String modifiedContent = origContent;

        try{
            JSONObject model = new JSONObject(origContent);

            addAddnPropertiesInPageModel(model, slingRequest);

            modifiedContent = model.toString();
        }catch(Exception e){
            log.error("Error at EAEMExtendPageModelFilter.this.getModifiedContent(origContent={}) {}", origContent, e);
            modifiedContent = origContent;
        }

        return modifiedContent;
    }

    private void addAddnPropertiesInPageModel(JSONObject model, SlingHttpServletRequest slingRequest) throws Exception{
        if(!model.has(CHILDREN)){
            return;
        }

        JSONObject childrenModel = model.getJSONObject(CHILDREN);
        Iterator<String> childrenItr = childrenModel.keys();
        ResourceResolver resolver = slingRequest.getResourceResolver();
        Resource pageContent;

        while(childrenItr.hasNext()) {
            String key = childrenItr.next();
            JSONObject childData = childrenModel.getJSONObject(key);

            pageContent = resolver.getResource(key + "/jcr:content");

            if(pageContent == null){
                continue;
            }

            ValueMap vm = pageContent.getValueMap();

            String slingVanityPath = vm.get(SLING_VANITYPATH, "");

            if(StringUtils.isNotEmpty(slingVanityPath)){
                childData.put(SLING_VANITYPATH_JSON_PROP, slingVanityPath);
            }
        }
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