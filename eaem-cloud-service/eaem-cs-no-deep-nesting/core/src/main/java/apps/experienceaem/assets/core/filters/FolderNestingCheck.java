package apps.experienceaem.assets.core.filters;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM folder nesting check",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=((.*.initiateUpload.json)|(.*.createasset.html))",
        }
)
public class FolderNestingCheck implements Filter {
    private static Logger log = LoggerFactory.getLogger(FolderNestingCheck.class);

    private static int S7_FOLDER_LENGTH_MAX = 240;
    private static String CONTENT_DAM_PATH = "/content/dam";
    private static String INITIATE_UPLOAD_JSON = ".initiateUpload.json";
    private static String CREATE_ASSET_HTML = ".createasset.html";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try{
            SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;
            SlingHttpServletResponse slingResponse = (SlingHttpServletResponse)response;

            String uri = slingRequest.getRequestURI();

            if(!uri.endsWith(INITIATE_UPLOAD_JSON) && !uri.endsWith(CREATE_ASSET_HTML)){
                chain.doFilter(request, response);
                return;
            }

            if(uri.contains(CONTENT_DAM_PATH)){
                String folderPath = uri.substring(uri.indexOf(CONTENT_DAM_PATH) + CONTENT_DAM_PATH.length());

                if(folderPath.endsWith(INITIATE_UPLOAD_JSON)){
                    folderPath = folderPath.substring(0, folderPath.lastIndexOf(INITIATE_UPLOAD_JSON));
                }else if(folderPath.endsWith(CREATE_ASSET_HTML)){
                    folderPath = folderPath.substring(0, folderPath.lastIndexOf(CREATE_ASSET_HTML));
                }

                if(folderPath.length() > S7_FOLDER_LENGTH_MAX){
                    log.info("Uploading to deep nested folders not allowed : " + uri);
                    slingResponse.sendError(SlingHttpServletResponse.SC_FORBIDDEN, "Uploading to deep nested folders not allowed: " + uri);
                    return;
                }
            }

            chain.doFilter(request, response);
        }catch(Exception e){
            log.error("Error checking folder nesting", e);
        }
    }

    @Override
    public void destroy() {
    }
}
