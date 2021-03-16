package apps.experienceaem.assets;

import opennlp.tools.util.StringUtil;
import org.apache.commons.io.IOUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.mime.MimeTypeService;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.servlet.Servlet;
import java.io.InputStream;
import java.io.OutputStream;

@Component(
        service = Servlet.class,
        property = {
                Constants.SERVICE_DESCRIPTION + "= Experience AEM Download Asset Version Servlet",
                "sling.servlet.methods=" + HttpConstants.METHOD_GET,
                "sling.servlet.paths=" + "/bin/eaem/downloadVersion"
        }
)
public class AssetVersionDownloadServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(AssetVersionDownloadServlet.class);

    @Reference
    transient MimeTypeService mimeTypeService;

    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response) {
        ResourceResolver resolver = request.getResourceResolver();
        String resPath = request.getParameter("resource");

        Resource assetPathResource = resolver.getResource(resPath + "/jcr:frozenNode/jcr:content/renditions/original/jcr:content");

        if(assetPathResource == null){
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return;
        }

        Node fileNode = assetPathResource.adaptTo(Node.class);
        Resource jcrContent = resolver.getResource(resPath + "/jcr:frozenNode/jcr:content");
        String mimeType = getMIMEType(jcrContent);

        InputStream is = null;

        try{
            is = fileNode.getProperty("jcr:data").getBinary().getStream();

            String fileName = jcrContent.getValueMap().get("cq:name", "");

            if(StringUtil.isEmpty(fileName)){
                response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            response.setContentType(mimeType);
            response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");

            final OutputStream out = response.getOutputStream();

            IOUtils.copy(is, out);

            out.close();

            is.close();
        }catch(Exception e){
            log.error("Error retrieving the version for " + resPath, e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private String getMIMEType(Resource resource){
        String cqName = resource.getValueMap().get("cq:name", "");
        return mimeTypeService.getMimeType(cqName.substring(cqName.indexOf('.') + 1));
    }
}
