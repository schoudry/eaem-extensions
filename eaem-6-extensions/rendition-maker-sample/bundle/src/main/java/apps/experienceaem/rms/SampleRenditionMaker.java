package apps.experienceaem.rms;

import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.Rendition;
import com.day.cq.dam.api.renditions.RenditionMaker;
import com.day.cq.dam.api.renditions.RenditionTemplate;
import com.day.cq.dam.api.thumbnail.ThumbnailConfig;
import com.day.cq.dam.commons.thumbnail.ThumbnailConfigImpl;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.List;

@Component(metatype = true, label = "Experience AEM Sample Rendition Maker")
@Service
@Properties({
        @Property(name = "sling.servlet.methods", value = {"GET"}, propertyPrivate = true),
        @Property(name = "sling.servlet.paths", value = "/bin/experience-aem/rms", propertyPrivate = true),
        @Property(name = "sling.servlet.extensions", value = "json", propertyPrivate = true)})
public class SampleRenditionMaker extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(SampleRenditionMaker.class);

    @Reference
    private RenditionMaker renditionMaker;

    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
                            throws ServletException,IOException {
        JSONObject json = new JSONObject();

        try {
            ResourceResolver resolver = request.getResourceResolver();
            String path = request.getParameter("path");

            if (path == null) {
                json.put("error", "Empty path");
                return;
            }

            Session session = resolver.adaptTo(Session.class);
            Asset asset = resolver.getResource(path).adaptTo(Asset.class);

            RenditionTemplate[] templates = createRenditionTemplates(asset);

            List<Rendition> renditionList = renditionMaker.generateRenditions(asset, templates);

            session.save();

            json.put("success", "Created - " + renditionList.get(0).getPath());

            json.write(response.getWriter());
        } catch (Exception e) {
            log.error("Error processing request", e);
        }
    }

    private RenditionTemplate[] createRenditionTemplates(Asset asset) {
        ThumbnailConfig[] thumbnails = new ThumbnailConfig[1];
        thumbnails[0] = new ThumbnailConfigImpl(250,250,false);

        RenditionTemplate[] templates = new RenditionTemplate[thumbnails.length];

        for (int i = 0; i < thumbnails.length; i++) {
            ThumbnailConfig thumb = thumbnails[i];

            templates[i] = renditionMaker.createThumbnailTemplate(asset,thumb.getWidth(),
                                thumb.getHeight(),thumb.doCenter());
        }

        return templates;
    }
}
