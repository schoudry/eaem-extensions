package apps.imagecustomar.image;

import java.awt.*;
import java.io.IOException;
import java.io.InputStream;

import javax.jcr.RepositoryException;
import javax.jcr.Property;
import javax.servlet.http.HttpServletResponse;

import com.day.cq.commons.ImageHelper;
import com.day.cq.wcm.foundation.Image;
import com.day.cq.wcm.commons.AbstractImageServlet;
import com.day.image.Layer;
import org.apache.commons.io.IOUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;

public class img_GET extends AbstractImageServlet {
    protected Layer createLayer(ImageContext c) throws RepositoryException, IOException {
        return null;
    }

    protected void writeLayer(SlingHttpServletRequest req, SlingHttpServletResponse resp, ImageContext c, Layer layer)
                                throws IOException, RepositoryException {
        Image image = new Image(c.resource);
        image.setItemName(Image.NN_FILE, "image");
        image.setItemName(Image.PN_REFERENCE, "imageReference");

        if (!image.hasContent()) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        layer = image.getLayer(false, false,false);

        String rUri = req.getRequestURI();
        String ratio = rUri.substring(rUri.lastIndexOf("/") + 1, rUri.lastIndexOf(".jpg"));
        String cords = c.properties.get(ratio, "");

        boolean modified = false;

        if(!"".equals(cords)){
            Rectangle rect = ImageHelper.getCropRect(cords, c.resource.getPath());
            layer.crop(rect);

            modified = true;
        }else{
            modified = image.crop(layer) != null;
        }

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