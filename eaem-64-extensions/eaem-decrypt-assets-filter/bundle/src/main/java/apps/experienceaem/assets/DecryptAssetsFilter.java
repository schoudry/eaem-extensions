package apps.experienceaem.assets;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.Part;

import javax.servlet.*;
import java.io.*;
import java.util.*;

@Component(
        metatype = true,
        description = "Experience AEM Request Decrypt Filter for CreateAssetServlet",
        label = "EAEM CreateAssetServlet InputStream Decrypt Filter")
@Service({Filter.class})
@Properties({
        @Property(name = "sling.filter.scope",value = {"REQUEST"}, propertyPrivate = true)
})
public class DecryptAssetsFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(DecryptAssetsFilter.class);

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

        log.info("Decoding create asset request - " + slingRequest.getRequestURI());

        Iterator parts = (Iterator)request.getAttribute("request-parts-iterator");

        if( (parts == null) || !parts.hasNext()){
            chain.doFilter(request, response);
            return;
        }

        List<Part> otherParts = new ArrayList<Part>();
        Part part = null;

        while(parts.hasNext()) {
            part = (Part) parts.next();

            otherParts.add(new EAEMDecryptRequestPart(part));
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

    private static class EAEMDecryptRequestPart implements Part {
        private final Part part;
        private final InputStream inputStream;
        private static final String TEMP_PREFIX = "eaem_decrypt_";

        public EAEMDecryptRequestPart(Part part) throws IOException {
            this.part = part;

            if(!isFilePart(part)){
                this.inputStream = new ByteArrayInputStream(IOUtils.toByteArray(part.getInputStream()));
            }else{
                this.inputStream = this.getDecodedStream(part);
            }
        }

        private InputStream getDecodedStream(Part part) throws IOException{
            File tmpFile = File.createTempFile(TEMP_PREFIX, ".tmp");

            byte[] decoded = Base64.getDecoder().decode(IOUtils.toByteArray(part.getInputStream()));

            FileOutputStream decodedStream = new FileOutputStream(tmpFile);

            decodedStream.write(decoded);

            decodedStream.close();

            return new FileInputStream(tmpFile);
        }

        private boolean isFilePart(Part part) {
            return StringUtils.isNotEmpty(part.getSubmittedFileName());
        }

        public InputStream getInputStream() throws IOException {
            return inputStream;
        }

        public  String getContentType() {
            return part.getContentType();
        }

        public  String getName() {
            return part.getName();
        }

        public  long getSize() {
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

        public  String getSubmittedFileName() {
            return part.getSubmittedFileName();
        }

        private <T>  Collection<T> toCollection(Iterator<T> i) {
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
