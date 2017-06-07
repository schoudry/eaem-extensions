package apps.imagemultifield.imagemultifield;

import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;

import javax.jcr.RepositoryException;
import javax.jcr.Property;
import javax.servlet.http.HttpServletResponse;

import com.day.cq.wcm.foundation.Image;
import com.day.cq.wcm.commons.AbstractImageServlet;
import com.day.image.Layer;
import org.apache.commons.io.IOUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;

public class img_GET extends AbstractImageServlet {

    protected Layer createLayer(ImageContext c)
            throws RepositoryException, IOException {
        return null;
    }

    protected void writeLayer(SlingHttpServletRequest req, SlingHttpServletResponse resp, ImageContext c, Layer layer)
            throws IOException, RepositoryException {
        Iterator<Resource> children = c.resource.listChildren();

        if(!children.hasNext()){
            return;
        }

        String rUri = req.getRequestURI();
        String selImage = rUri.substring(rUri.lastIndexOf("/"));
        Resource resource = req.getResourceResolver().getResource(children.next().getPath() + selImage);

        if(resource == null){
            return;
        }

        Image image = new Image(resource);
        image.setItemName(Image.NN_FILE, "image");
        image.setItemName(Image.PN_REFERENCE, "imageReference");

        if (!image.hasContent()) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        image.set(Image.PN_MIN_WIDTH, c.properties.get("minWidth", ""));
        image.set(Image.PN_MIN_HEIGHT, c.properties.get("minHeight", ""));
        image.set(Image.PN_MAX_WIDTH, c.properties.get("maxWidth", ""));
        image.set(Image.PN_MAX_HEIGHT, c.properties.get("maxHeight", ""));

        layer = image.getLayer(false, false, false);

        boolean modified = image.crop(layer) != null;

        modified |= image.resize(layer) != null;

        modified |= image.rotate(layer) != null;

        if (modified) {
            resp.setContentType(c.requestImageType);
            layer.write(c.requestImageType, 1.0, resp.getOutputStream());
        } else {
            Property data = image.getData();
            InputStream in = data.getStream();
            resp.setContentLength((int) data.getLength());
            String contentType = image.getMimeType();

            if (contentType.equals("application/octet-stream")) {
                contentType=c.requestImageType;
            }

            resp.setContentType(contentType);
            IOUtils.copy(in, resp.getOutputStream());

            in.close();
        }

        resp.flushBuffer();
    }
}