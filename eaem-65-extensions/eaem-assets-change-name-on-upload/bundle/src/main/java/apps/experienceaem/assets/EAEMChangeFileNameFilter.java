package apps.experienceaem.assets;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.request.RequestParameter;
import org.apache.sling.api.request.RequestParameterMap;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.apache.sling.scripting.sightly.extension.RuntimeExtension;
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
    public static String FILE_NAME = "fileName";

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
            SlingHttpServletRequestWrapper wrapper = new NameChangeServletRequestWrapper(slingRequest);
            chain.doFilter(wrapper, response);
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

    private class NameChangeServletRequestWrapper extends SlingHttpServletRequestWrapper {
        private NameChangeRequestParameterMap origParamMap = null;

        public NameChangeServletRequestWrapper(final SlingHttpServletRequest request) {
            super(request);
            origParamMap = new NameChangeRequestParameterMap(request.getRequestParameterMap());
        }

        @Override
        public RequestParameterMap getRequestParameterMap() {
            return origParamMap;
        }
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

    // for non streaming requests (uploaded using asset link)
    private class NameChangeRequestParameterMap implements RequestParameterMap {
        private RequestParameterMap origParamMap = null;

        public NameChangeRequestParameterMap(RequestParameterMap origParamMap){
            this.origParamMap = origParamMap;
        }

        public RequestParameter[] getValues(String s) {
            return origParamMap.getValues(s);
        }

        public RequestParameter getValue(String name) {
            if(!FILE_NAME.equals(name)){
                return origParamMap.getValue(name);
            }

            RequestParameter fileNameParam = origParamMap.getValue(FILE_NAME);

            if((fileNameParam == null) || StringUtils.isEmpty(fileNameParam.getString())
                    || !fileNameParam.getString().contains(STRING_MATCH)){
                log.debug("Return (non streaming request) unprocessed file name");
                return fileNameParam;
            }

            final String fileName = fileNameParam.getString().trim().replaceAll(STRING_MATCH, "-");

            log.debug("Uploaded file name changed to : " + fileName);

            fileNameParam = new RequestParameter() {
                public String getName() {
                    return FILE_NAME;
                }

                public boolean isFormField() {
                    return true;
                }

                public String getContentType() {
                    return null;
                }

                public long getSize() {
                    return fileName.length();
                }

                public byte[] get() {
                    return fileName.getBytes();
                }

                public InputStream getInputStream() throws IOException {
                    return new ByteArrayInputStream(fileName.getBytes());
                }

                public String getFileName() {
                    return null;
                }

                public String getString() {
                    return fileName;
                }

                public String getString(String s) throws UnsupportedEncodingException {
                    return fileName;
                }
            };

            return fileNameParam;
        }

        public int size() {
            return origParamMap.size();
        }

        public boolean isEmpty() {
            return origParamMap.isEmpty();
        }

        public boolean containsKey(Object key) {
            return origParamMap.containsKey(key);
        }

        public boolean containsValue(Object value) {
            return origParamMap.containsValue(value);
        }

        public RequestParameter[] get(Object key) {
            return origParamMap.get(key);
        }

        public RequestParameter[] put(String key, RequestParameter[] value) {
            throw new UnsupportedOperationException("Not supported");
        }

        public RequestParameter[] remove(Object key) {
            throw new UnsupportedOperationException("Not supported");
        }

        public void putAll(Map<? extends String, ? extends RequestParameter[]> m) {
            throw new UnsupportedOperationException("Not supported");
        }

        public void clear() {
            throw new UnsupportedOperationException("Not supported");
        }

        public Set<String> keySet() {
            return origParamMap.keySet();
        }

        public Collection<RequestParameter[]> values() {
            return origParamMap.values();
        }

        public Set<Entry<String, RequestParameter[]>> entrySet() {
            return origParamMap.entrySet();
        }
    }
}
