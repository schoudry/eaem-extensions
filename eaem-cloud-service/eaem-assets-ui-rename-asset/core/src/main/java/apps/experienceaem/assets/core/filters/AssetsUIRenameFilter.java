package apps.experienceaem.assets.core.filters;

import com.adobe.granite.asset.api.AssetManager;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.io.*;
import java.util.*;

import static org.osgi.service.http.whiteboard.HttpWhiteboardConstants.HTTP_WHITEBOARD_FILTER_SERVLET;

@Component(
    service = Filter.class,
    immediate = true,
    property = {"service.description=Filter for Repository API bundle to capture metrics", "osgi.http.whiteboard.filter.servlet=com.adobe.aem.repoapi.RepoApiServlet", "osgi.http.whiteboard.context.select=(osgi.http.whiteboard.context.name=*)"}
)
public class AssetsUIRenameFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(AssetsUIRenameFilter.class);

    private static final String ADOBE_REPO = "/adobe/repository";
    private static final String RESOURCE_METADATA_REPOSITORY_ASSET = "assetmetadata";
    private static final String DELIMITER_BODY_PARAMETER = "&";
    private static final String DELIMITER_PATH_PARAMETER = ";";
    private static final String DELIMITER_NAME_VALUE = "=";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;

        try {
            ResourceResolver resolver = (ResourceResolver)httpRequest.getAttribute("org.apache.sling.auth.core.ResourceResolver");
            String requestURI = httpRequest.getRequestURI();

            Map<String, String> pathParams = getPathParameters(getPathParameterString(httpRequest).split(";"));

            if(!RESOURCE_METADATA_REPOSITORY_ASSET.equals(pathParams.get("resource"))){
                chain.doFilter(request, response);
                return;
            }

            //String resourcePath = "/content/dam" + requestURI.substring(ADOBE_REPO.length(), requestURI.indexOf(";"));
            String resourcePath = requestURI.substring(ADOBE_REPO.length(), requestURI.indexOf(";"));

            Resource resource = resolver.getResource(resourcePath);

            if( resource == null ){
                chain.doFilter(request, response);
                return;
            }

            ResettableStreamHttpServletRequest wrappedRequest = new ResettableStreamHttpServletRequest(httpRequest);

            String payload = IOUtils.toString(wrappedRequest.getReader());

            if( (payload == null) || !payload.startsWith("[")){
                wrappedRequest.resetInputStream();
                chain.doFilter(wrappedRequest, response);
                return;
            }

            Gson gson = new Gson();
            JsonArray payloadJson = gson.fromJson(payload, JsonArray.class);

            if(payloadJson.isEmpty()){
                wrappedRequest.resetInputStream();
                chain.doFilter(wrappedRequest, response);
                return;
            }

            JsonObject payloadObject = payloadJson.get(0).getAsJsonObject();
            String assetName = null;

            if(payloadObject.get("op").getAsString().equals("add")
                && payloadObject.get("path").getAsString().equals("/dc:title")){
                assetName = payloadObject.get("value").getAsString();
            }

            wrappedRequest.resetInputStream();
            chain.doFilter(wrappedRequest, response);

            if(assetName != null){
                AssetManager assetManager = resolver.adaptTo(AssetManager.class);
                String destPath = resource.getParent().getPath() + "/" + assetName;

                assetManager.moveAsset(resource.getPath(), destPath);
                resolver.commit();
            }
        } catch (Exception e) {
            log.error("Error renaming resource : " + httpRequest.getRequestURI());
        }
    }

    private static class ResettableStreamHttpServletRequest extends HttpServletRequestWrapper {
        private byte[] rawData;
        private HttpServletRequest request;
        private ResettableServletInputStream servletStream;

        public ResettableStreamHttpServletRequest(HttpServletRequest request) {
            super(request);
            this.request = request;
            this.servletStream = new ResettableServletInputStream();
        }

        public void resetInputStream() {
            servletStream.stream = new ByteArrayInputStream(rawData);
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            if (rawData == null) {
                rawData = IOUtils.toByteArray(this.request.getReader());
                servletStream.stream = new ByteArrayInputStream(rawData);
            }
            return servletStream;
        }

        @Override
        public BufferedReader getReader() throws IOException {
            if (rawData == null) {
                rawData = IOUtils.toByteArray(this.request.getReader());
                servletStream.stream = new ByteArrayInputStream(rawData);
            }
            return new BufferedReader(new InputStreamReader(servletStream));
        }

        private class ResettableServletInputStream extends ServletInputStream {
            private InputStream stream;

            @Override
            public int read() throws IOException {
                return stream.read();
            }

            @Override
            public boolean isFinished() {
                return false;
            }

            @Override
            public boolean isReady() {
                return false;
            }

            @Override
            public void setReadListener(ReadListener readListener) {
            }
        }
    }

    private String getPathParameterString(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        int pathParamStart = requestUri.indexOf(";");
        return pathParamStart >= 0 ? requestUri.substring(pathParamStart) : "";
    }

    private Map<String, String> getPathParameters(String[] pathParameterPairs) throws Exception {
        List<String[]> parameterValuePairs = new ArrayList<>();
        for (String pathParameterPair : pathParameterPairs) {
            String[] nameValue = pathParameterPair.split(DELIMITER_NAME_VALUE);
            if (nameValue.length == 1 || nameValue.length == 2 || nameValue.length == 3) {
                String name = nameValue[0];
                if (!name.equals("")) {
                    parameterValuePairs.add(new String[] {
                        name,
                        (nameValue.length == 2) ? nameValue[1] : ((nameValue.length == 3) ? nameValue[1]+DELIMITER_NAME_VALUE+nameValue[2] : "")
                    });
                }
            }
        }

        Map<String, String> pathParameters = new HashMap<>();

        for (String[] parameterValuePair : parameterValuePairs) {
            if (!pathParameters.containsKey(parameterValuePair[0])) {
                pathParameters.put(parameterValuePair[0], parameterValuePair[1]);
            }
        }

        return pathParameters;
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void destroy() {
    }
}
