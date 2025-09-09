package apps.experienceaem.sites.core.servlets;

import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;

import com.adobe.cq.sightly.WCMUsePojo;

public class RequestHeaderHelper extends WCMUsePojo {
    private Map<String, String> headers;

    @Override
    public void activate() throws Exception {
        HttpServletRequest request = getRequest();
        headers = new LinkedHashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headers.put(headerName, request.getHeader(headerName));
        }
    }

    public Map<String, String> getHeaders() {
        return headers;
    }
}
