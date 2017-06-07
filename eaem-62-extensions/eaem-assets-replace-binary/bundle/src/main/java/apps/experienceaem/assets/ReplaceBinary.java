package apps.experienceaem.assets;

import com.day.cq.dam.api.Asset;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.ServletException;
import java.io.InputStream;

@Component(metatype = true, label = "Experience AEM Replace Binary Servlet")
@Service
@Properties({
        @Property(name = "sling.servlet.methods", value = { "POST" }, propertyPrivate = true),
        @Property(name = "sling.servlet.paths", value = "/bin/eaem/replace-binary", propertyPrivate = true)
})
public class ReplaceBinary extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(ReplaceBinary.class);

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
                            throws ServletException {
        ResourceResolver resourceResolver = request.getResourceResolver();

        String toBeReplacedAssetPath = request.getParameter("toBeReplacedAssetPath");
        String replaceWithAssetPath = request.getParameter("replaceWithAssetPath");
        String deleteSource = request.getParameter("deleteSource");

        replaceBinary(resourceResolver, toBeReplacedAssetPath, replaceWithAssetPath, deleteSource);
    }

    private void replaceBinary(ResourceResolver resourceResolver, String toBeReplacedAssetPath,
                               String replaceWithAssetPath, String deleteSource) {
        Resource toBeReplacedResource = resourceResolver.getResource(toBeReplacedAssetPath);
        Resource replacingResource = resourceResolver.getResource(replaceWithAssetPath);

        Asset toBeReplacedAsset = toBeReplacedResource.adaptTo(Asset.class);
        Asset replacingAsset = replacingResource.adaptTo(Asset.class);

        String mimeType = toBeReplacedAsset.getMimeType();

        Resource original = replacingAsset.getOriginal();
        InputStream stream = original.adaptTo(InputStream.class);

        toBeReplacedAsset.addRendition("original", stream, mimeType);

        if(!"true".equals(deleteSource)){
            return;
        }

        try{
            Session session = resourceResolver.adaptTo(Session.class);
            session.removeItem(replacingResource.getPath());

            session.save();
        }catch(Exception e){
            log.warn("Error removing asset - " + replacingResource.getPath());
        }
    }
}
