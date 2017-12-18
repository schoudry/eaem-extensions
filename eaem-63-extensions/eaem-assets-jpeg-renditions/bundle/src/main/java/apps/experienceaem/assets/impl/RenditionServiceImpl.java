package apps.experienceaem.assets.impl;

import apps.experienceaem.assets.RenditionsService;
import com.adobe.cq.gfx.Gfx;
import com.adobe.cq.gfx.Instructions;
import com.adobe.cq.gfx.Layer;
import com.adobe.cq.gfx.Plan;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.Rendition;
import com.day.cq.dam.api.renditions.RenditionMaker;
import com.day.cq.dam.api.renditions.RenditionTemplate;
import com.day.cq.dam.api.thumbnail.ThumbnailConfig;
import com.day.cq.dam.commons.thumbnail.ThumbnailConfigImpl;
import com.day.cq.dam.commons.util.DamUtil;
import com.day.cq.dam.commons.util.OrientationUtil;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.resource.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;

/**
 * Rendition Service Implementation...
 */
@Component(
        name="Experience AEM Renditions Generator...",
        metatype = true, immediate = true
)
@Property(name="service.description", value="Experience AEM Generate JPEG Renditions for Images")
@Service
public class RenditionServiceImpl implements RenditionsService {

    protected final Logger log = LoggerFactory.getLogger(this.getClass());

    @Reference
    private RenditionMaker renditionMaker;

    @Reference
    private Gfx gfx;

    public Asset generateJpegRenditions(Resource resource, Integer width, Integer height) throws Exception {
        Asset asset = DamUtil.resolveToAsset(resource);

        log.info("Generating JPEG renditions for asset - " + asset.getPath());

        RenditionTemplate[] templates = createRenditionTemplates(asset, width, height);

        renditionMaker.generateRenditions(asset, templates);

        return asset;
    }

    private RenditionTemplate[] createRenditionTemplates(Asset asset, Integer width, Integer height) {
        ThumbnailConfig[] thumbnails = new ThumbnailConfig[1];

        thumbnails[0] = new ThumbnailConfigImpl(width,height,true);

        RenditionTemplate[] templates = new RenditionTemplate[thumbnails.length];

        for (int i = 0; i < thumbnails.length; i++) {
            ThumbnailConfig thumb = thumbnails[i];

            templates[i] = createThumbnailTemplate(asset, thumb.getWidth(), thumb.getHeight(), thumb.doCenter());
        }

        return templates;
    }

    private class JpegTemplate implements RenditionTemplate {
        public Plan plan;
        public String renditionName;
        public String mimeType;

        public Rendition apply(Asset asset) {
            InputStream stream = null;
            try {
                stream = gfx.render(plan, asset.adaptTo(Resource.class).getResourceResolver());
                if (stream != null) {
                    return asset.addRendition(renditionName, stream, mimeType);
                }
            } finally {
                IOUtils.closeQuietly(stream);
            }
            return null;
        }
    }

    private RenditionTemplate createThumbnailTemplate(Asset asset, int width, int height, boolean doCenter) {
        JpegTemplate template = new JpegTemplate();

        final Rendition rendition = asset.getOriginal();

        template.renditionName = "cq5dam.thumbnail." + width + "." + height + ".jpeg";
        template.mimeType = "image/jpeg";
        template.plan = gfx.createPlan();

        template.plan.layer(0).set("src", rendition.getPath());

        applyOrientation(OrientationUtil.getOrientation(asset), template.plan.layer(0));

        applyThumbnail(width, height, doCenter, template.mimeType, template.plan);

        return template;
    }

    private static void applyThumbnail(int width, int height, boolean doCenter, String mimeType, Plan plan) {
        Instructions global = plan.view();

        global.set("wid", width);
        global.set("hei", height);
        global.set("rszfast", Boolean.FALSE);

        global.set("fit", doCenter ? "fit,1" : "constrain,1");

        String fmt = StringUtils.substringAfter(mimeType, "/");

        if ("png".equals(fmt) || "gif".equals(fmt) || "tif".equals(fmt)) {
            fmt = fmt + "-alpha";
        }

        global.set("fmt", fmt);
    }

    private static void applyOrientation(short exifOrientation, Layer layer) {
        switch (exifOrientation) {
            case OrientationUtil.ORIENTATION_MIRROR_HORIZONTAL:
                layer.set("flip", "lr");
                break;
            case OrientationUtil.ORIENTATION_ROTATE_180:
                layer.set("rotate", 180);
                break;
            case OrientationUtil.ORIENTATION_MIRROR_VERTICAL:
                layer.set("flip", "ud");
                break;
            case OrientationUtil.ORIENTATION_MIRROR_HORIZONTAL_ROTATE_270_CW:
                layer.set("flip", "lr");
                layer.set("rotate", 270);
                break;
            case OrientationUtil.ORIENTATION_ROTATE_90_CW:
                layer.set("rotate", 90);
                break;
            case OrientationUtil.ORIENTATION_MIRROR_HORIZONTAL_ROTATE_90_CW:
                layer.set("flip", "lr");
                layer.set("rotate", 90);
                break;
            case OrientationUtil.ORIENTATION_ROTATE_270_CW:
                layer.set("rotate", 270);
                break;
        }
    }
}
