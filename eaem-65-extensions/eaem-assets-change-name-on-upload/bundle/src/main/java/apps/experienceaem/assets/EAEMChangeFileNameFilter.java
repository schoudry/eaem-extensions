package apps.experienceaem.assets;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.osgi.service.component.annotations.Component;
import org.osgi.framework.Constants;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.Part;

import javax.servlet.*;
import java.io.*;
import java.util.*;

@Component(
        immediate = true,
        service = Filter.class,
        name = "Experience AEM Request Name Change Filter for CreateAssetServlet Streaming Requests",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=REQUEST"
        })
public class EAEMChangeFileNameFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(EAEMChangeFileNameFilter.class);

    private static final String STRING_MATCH = " ";

    public void init(FilterConfig filterConfig) throws ServletException {
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof SlingHttpServletRequest) || !(response instanceof SlingHttpServletResponse)) {
            chain.doFilter(request, response);
            return;
        }

        final SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;

        if (!StringUtils.equals("POST", slingRequest.getMethod()) || !isCreateAssetRequest(slingRequest) ) {
            chain.doFilter(request, response);
            return;
        }

        Iterator parts = (Iterator)request.getAttribute("request-parts-iterator");

        if( (parts == null) || !parts.hasNext()){
            chain.doFilter(request, response);
            return;
        }

        List<Part> otherParts = new ArrayList<Part>();
        Part part = null;

        while(parts.hasNext()) {
            part = (Part) parts.next();

            otherParts.add(new EAEMFileNameRequestPart(part));
        }

        request.setAttribute("request-parts-iterator", otherParts.iterator());

        chain.doFilter(request, response);
    }

    private boolean isCreateAssetRequest(SlingHttpServletRequest slingRequest){
        String[] selectors = slingRequest.getRequestPathInfo().getSelectors();

        if(ArrayUtils.isEmpty(selectors) || (selectors.length > 1)){
            return false;
        }

        return selectors[0].equals("createasset");
    }

    public void destroy() {
    }

    //code copied form https://svn.apache.org/repos/asf/sling/trunk/bundles/engine/src/main/java/org/apache/sling/engine/impl/parameters/RequestPartsIterator.java
    private static class EAEMFileNameRequestPart implements Part {
        private final Part part;
        private final InputStream inputStream;

        public EAEMFileNameRequestPart(Part part) throws IOException {
            this.part = part;

            if(!isFileNamePart(part)){
                this.inputStream = new ByteArrayInputStream(IOUtils.toByteArray(part.getInputStream()));
            }else{
                this.inputStream = this.getFileNameAdjustedStream(part);
            }
        }

        private InputStream getFileNameAdjustedStream(Part part) throws IOException{
            String fileName = null;

            try{
                fileName = IOUtils.toString(part.getInputStream(), "UTF-8");
            }catch(Exception e){
                log.error("Error reading filename from stream...");
            }

            if(fileName == null){
                fileName = "";
            }

            if(!fileName.contains(STRING_MATCH)){
                log.debug("Return unprocessed file name : " + fileName);
                return new ByteArrayInputStream(fileName.getBytes());
            }

            fileName = fileName.trim().replaceAll(STRING_MATCH, "-");

            log.debug("Uploaded file name changed to : " + fileName);

            return new ByteArrayInputStream(fileName.getBytes());
        }

        private boolean isFileNamePart(Part part){
            return ("fileName".equals(part.getName()));
        }

        public InputStream getInputStream() throws IOException {
            return inputStream;
        }

        public  String getContentType() {
            return part.getContentType();
        }

        public String getName() {
            return part.getName();
        }

        public long getSize() {
            return 0;
        }

        public  void write(String s) throws IOException {
            throw new UnsupportedOperationException("Writing parts directly to disk is not supported by this implementation, use getInputStream instead");
        }

        public  void delete() throws IOException {
        }

        public  String getHeader(String headerName) {
            return part.getHeader(headerName);
        }

        public  Collection<String> getHeaders(String headerName) {
            return part.getHeaders(headerName);
        }

        public  Collection<String> getHeaderNames() {
            return part.getHeaderNames();
        }

        public String getSubmittedFileName() {
            return part.getSubmittedFileName();
        }

        private <T> Collection<T> toCollection(Iterator<T> i) {
            if ( i == null ) {
                return Collections.emptyList();
            } else {
                List<T> c = new ArrayList<T>();
                while(i.hasNext()) {
                    c.add(i.next());
                }
                return c;
            }
        }
    }
}
