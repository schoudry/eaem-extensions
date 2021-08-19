package apps.experienceaem.sites.core.filters;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
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
        name = "EAEM Sling Model Response Modifier Servlet Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=.*.model.json"
        }
)
public class EAEMAdjustModelJSONFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(EAEMAdjustModelJSONFilter.class);

    private static String TEXT_COMP_TYPE = "eaem-no-decoration/components/text";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try {
            SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
            SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;

            String uri = slingRequest.getRequestURI();

            if (!uri.endsWith(".model.json")) {
                chain.doFilter(request, response);
                return;
            }

            SlingHttpServletResponse modelResponse = new DefaultSlingModelResponseWrapper(slingResponse);

            chain.doFilter(slingRequest, modelResponse);

            PrintWriter responseWriter = response.getWriter();

            responseWriter.write(getModifiedContent(modelResponse.toString(), slingRequest));

        } catch (Exception e) {
            throw new ServletException("Error at EAEMAdjustModelJSONFilter.this.doFilter()");
        }
    }

    private String getModifiedContent(String origContent, SlingHttpServletRequest slingRequest) {
        String modifiedContent = origContent;

        try{
            JSONObject model = new JSONObject(origContent);

            ResourceResolver resolver = slingRequest.getResourceResolver();

            model = (JSONObject) replaceEaemDataObject(model, resolver);

            modifiedContent = model.toString();
        }catch(Exception e){
            log.error("Error at RHDefaultModelJSONFilter.this.getModifiedContent(origContent={}) {}", origContent, e);
            modifiedContent = origContent;
        }

        return modifiedContent;
    }

    private Object replaceEaemDataObject(JSONObject jsonObject, ResourceResolver resolver) throws Exception {
        Iterator<String> itr = jsonObject.keys();
        String key;

        JSONObject modJSONObj = new JSONObject();

        while (itr.hasNext()) {
            key = itr.next();
            String value = jsonObject.getString(key);

            if (key.equals(":type")) {
                modJSONObj.put(key, value);

                if (TEXT_COMP_TYPE.equals(value)) {
                    ValueMap vm = resolver.getResource("/apps/" + TEXT_COMP_TYPE).getValueMap();
                    modJSONObj.put("aemNoDecoration", vm.get("aemNoDecoration", Boolean.class));
                }
            }else {
                Object jsonValue = jsonObject.get(key);

                if (JSONObject.class.isInstance(jsonValue)) {
                    modJSONObj.put(key, replaceEaemDataObject((JSONObject) jsonValue, resolver));
                } else {
                    modJSONObj.put(key, jsonValue);
                }
            }
        }

        return modJSONObj;
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

    @Override
    public void destroy() {
    }
}
