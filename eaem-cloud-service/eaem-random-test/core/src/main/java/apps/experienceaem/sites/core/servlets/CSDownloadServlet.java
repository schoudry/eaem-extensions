package apps.experienceaem.sites.core.servlets;

import com.adobe.xfa.ut.StringUtils;
import com.day.cq.search.PredicateGroup;
import com.day.cq.search.Query;
import com.day.cq.search.QueryBuilder;
import com.day.cq.search.result.Hit;
import com.day.cq.search.result.SearchResult;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.apache.sling.api.wrappers.SlingHttpServletResponseWrapper;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.RequestDispatcher;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import java.io.*;
import java.util.HashMap;
import java.util.Map;

@Component(
    immediate = true,
    service = Servlet.class,
    property = {
        Constants.SERVICE_DESCRIPTION + "=Experience AEM Download Servlet",
        "sling.servlet.methods=" + HttpConstants.METHOD_GET,
        "sling.servlet.resourceTypes=sling/servlet/default",
        "sling.servlet.extensions=" + "eaemDownload"
    }
)
public class CSDownloadServlet extends SlingSafeMethodsServlet {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private String DOWNLOAD_BINS_SEL =".downloadbinaries.json";
    private String ATTR_TARGET = "target";

    @Reference
    private QueryBuilder builder;

    @Override
    protected void doGet(final SlingHttpServletRequest req, final SlingHttpServletResponse resp) {
        try{
            String fileName = req.getRequestPathInfo().getResourcePath();

            if(StringUtils.isEmpty(fileName)){
                throw new ServletException("Empty file name");
            }

            fileName = fileName.substring(1, fileName.lastIndexOf("."));

            ResourceResolver resolver = req.getResourceResolver();

            Query query = builder.createQuery(PredicateGroup.create(getPredicateMap(fileName)), resolver.adaptTo(Session.class));

            SearchResult result = query.getResult();
            String resourcePath = null;

            for (Hit hit : result.getHits()) {
                resourcePath = hit.getPath();
            }

            if(resourcePath == null){
                throw new ServletException("Resource not found with name : " + fileName);
            }

            req.setAttribute(ATTR_TARGET, getTargetBody(resourcePath, fileName));

            SlingHttpServletRequest wrapperRequest = new InputSlingServletRequestWrapper(req);
            SlingHttpServletResponse wrapperResponse = new OutputSlingModelResponseWrapper(resp);

            RequestDispatcher dp = wrapperRequest.getRequestDispatcher(resourcePath + DOWNLOAD_BINS_SEL);

            dp.include(wrapperRequest, wrapperResponse);

            Gson gson = new Gson();
            JsonObject json = gson.fromJson(wrapperResponse.toString(), JsonObject.class);

            String downloadUri = json.get("artifacts").getAsJsonArray().get(0).getAsJsonObject().get("uri").getAsString();

            resp.sendRedirect(downloadUri);
        } catch (Exception e) {
            logger.error("Error downloading asset : ", e);
        }
    }

    private String getTargetBody(String resourcePath, String archiveName){
        return "{\"targets\":[{\"parameters\":{\"path\":\"" + resourcePath + "\",\"archiveName\":\"" + archiveName + "\"}}]}";
    }

    private static Map<String, String> getPredicateMap(String fileName) {
        Map<String, String> map = new HashMap<>();

        map.put("type", "dam:Asset");
        map.put("nodename", fileName);
        map.put("p.limit", "1");

        return map;
    }

    private class InputSlingServletRequestWrapper extends SlingHttpServletRequestWrapper {
        private byte[] requestData;
        private HttpServletRequest request;

        public InputSlingServletRequestWrapper(final SlingHttpServletRequest request) {
            super(request);
            this.request = request;
        }

        public String getMethod(){
            return "POST";//change method from GET to POST
        }

        public String getParameter(String paramName){
            return this.request.getParameter(paramName);
        }

        public String getHeader(String headerName){
            if(headerName.equals("User-Agent")){
                return "Experience-AEM"; // to bypass CSRF Filter
            }
            return this.request.getHeader(headerName);
        }

        @Override
        public BufferedReader getReader() throws IOException {
            if (requestData == null) {
                requestData = IOUtils.toByteArray(this.request.getAttribute(ATTR_TARGET).toString());
            }

            return new BufferedReader(new InputStreamReader(new ByteArrayInputStream(requestData)));
        }
    }

    private class OutputSlingModelResponseWrapper extends SlingHttpServletResponseWrapper {
        private CharArrayWriter writer;

        public OutputSlingModelResponseWrapper (final SlingHttpServletResponse response) {
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
