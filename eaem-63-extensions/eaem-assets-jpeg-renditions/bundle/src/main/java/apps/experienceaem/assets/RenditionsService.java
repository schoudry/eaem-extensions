package apps.experienceaem.assets;

import com.day.cq.dam.api.Asset;
import org.apache.sling.api.resource.Resource;

/**
 * Rendition Service...
 */
public interface RenditionsService {
    Asset generateJpegRenditions(Resource resource, Integer width, Integer height) throws Exception;
}
