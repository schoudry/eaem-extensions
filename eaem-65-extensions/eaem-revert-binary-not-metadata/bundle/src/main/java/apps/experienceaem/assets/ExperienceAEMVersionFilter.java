package apps.experienceaem.assets;

import com.day.cq.commons.jcr.JcrUtil;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import javax.servlet.*;
import java.io.IOException;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM Restore file only (not metadata) Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.selectors=version"
        }
)
public class ExperienceAEMVersionFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(ExperienceAEMVersionFilter.class);

    private static String EAEM_REVERT_PARAM = "eaem-revert-toversion-file-only";
    private static String METADATA_BACKUP = "metadata-backup";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest)request;

        String assetPath = slingRequest.getParameter("path");

        if(StringUtils.isEmpty(assetPath)){
            chain.doFilter(slingRequest, response);
            return;
        }

        String revertParam = slingRequest.getParameter(EAEM_REVERT_PARAM);

        if(StringUtils.isEmpty(revertParam)){
            chain.doFilter(slingRequest, response);
            return;
        }

        ResourceResolver resolver = slingRequest.getResourceResolver();
        Session session = resolver.adaptTo(Session.class);
        Resource assetResource = resolver.getResource(assetPath);

        if(assetResource == null){
            chain.doFilter(slingRequest, response);
            return;
        }

        String folderPath = assetPath.substring(0, assetPath.lastIndexOf("/"));
        String backupName = assetResource.getName() + "-" + METADATA_BACKUP;
        String backupPath = folderPath + "/" + backupName;

        Resource metadata = assetResource.getChild("jcr:content/metadata");

        if(metadata == null){
            chain.doFilter(slingRequest, response);
            return;
        }

        try{
            if(session.itemExists(backupPath)){
                session.removeItem(backupPath);
            }

            JcrUtil.copy(metadata.adaptTo(Node.class), resolver.getResource(folderPath).adaptTo(Node.class), backupName, true);

            chain.doFilter(slingRequest, response);

            String metadataPath = metadata.getPath();

            session.removeItem(metadataPath);

            session.move(backupPath, metadataPath);

            session.save();
        }catch(Exception e){
            logger.error("Error taking metadata backup - " + assetPath , e);
        }
    }

    @Override
    public void destroy() {
    }
}
