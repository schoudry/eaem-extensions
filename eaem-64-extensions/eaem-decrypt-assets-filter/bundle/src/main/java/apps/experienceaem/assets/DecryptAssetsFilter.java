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
        description = "Experience AEM Request filter for CreateAssetServlet",
        label = "EAEM CreateAssetServlet InputStream Filter")
@Service({Filter.class})
@Properties({
        @Property(name = "sling.filter.scope",value = {"REQUEST"},propertyPrivate = true)
})
public class DecryptAssetsFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(DecryptAssetsFilter.class);

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof SlingHttpServletRequest) || !(response instanceof SlingHttpServletResponse)) {
            chain.doFilter(request, response);
            return;
        }

        final SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;
        final SlingHttpServletResponse slingResponse = (SlingHttpServletResponse) response;

        if (!StringUtils.equals("POST", slingRequest.getMethod()) || !isCreateAssetRequest(slingRequest) ) {
            chain.doFilter(request, response);
            return;
        }

        log.info("Filtering create asset request - " + slingRequest.getRequestURI());

        Iterator parts = (Iterator)request.getAttribute("request-parts-iterator");

        if( (parts == null) || !parts.hasNext()){
            chain.doFilter(request, response);
            return;
        }

        List<Part> otherParts = new ArrayList<Part>();

        while(parts.hasNext()) {
            Part part = (Part) parts.next();

            otherParts.add(new EAEMDecryptRequestPart(part));
        }

        request.setAttribute("request-parts-iterator", otherParts.iterator());

        chain.doFilter(request, response);
    }

    private boolean isFormField(Part part) {
        return (part.getSubmittedFileName() == null);
    }

    private boolean isStreaming(SlingHttpServletRequest request) {
        Iterator itr = (Iterator)request.getAttribute("request-parts-iterator");
        return ((itr != null) && (itr.hasNext()));
    }

    private boolean isCreateAssetRequest(SlingHttpServletRequest slingRequest){
        String[] selectors = slingRequest.getRequestPathInfo().getSelectors();
        boolean isCreateRequest = false;

        if(ArrayUtils.isEmpty(selectors) || (selectors.length > 1)){
            return isCreateRequest;
        }

        isCreateRequest = selectors[0].equals("createasset");

        return isCreateRequest;
    }

    @Override
    public void destroy() {
    }

    private static class EAEMDecryptRequestPart implements Part {
        private final Part part;
        private final InputStream inputStream;

        public EAEMDecryptRequestPart(Part part) throws IOException {
            this.part = part;
            this.inputStream = new ByteArrayInputStream(IOUtils.toByteArray(part.getInputStream()));
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
            // no underlying storage is used, so nothing to delete.
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
