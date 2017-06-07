package apps.mysample.imagecrop;

import com.day.cq.commons.ImageHelper;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.commons.util.DamUtil;
import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.WorkflowProcess;
import com.day.cq.workflow.metadata.MetaDataMap;
import com.day.image.Layer;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.*;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Property;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.jcr.resource.JcrResourceResolverFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.*;
import java.awt.*;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;

@Component(metatype = true)
@Service
@Property(name = "process.label", value = "Crop Image In Inbox")
public class ImageCropStep implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(ImageCropStep.class);

    @Reference(policy = ReferencePolicy.STATIC)
    private JcrResourceResolverFactory factory;


    @Override
    public void execute(WorkItem item, WorkflowSession session, MetaDataMap metaData)
                            throws WorkflowException {
        try{
            createCroppedRendition(item, session);
        }catch(Exception e){
            log.error("error generating cropped rendition", e);
            throw new WorkflowException("Crop failed", e);
        }
    }

    private void createCroppedRendition(WorkItem item, WorkflowSession session) throws Exception {
        Resource resource = getResourceFromPayload(item, session.getSession());
        Resource dataResource = resource.getChild("jcr:content/renditions/original/jcr:content");

        ValueMap map = resource.getChild("jcr:content").adaptTo(ValueMap.class);
        String cords = map.get("imageCrop", String.class);

        if(StringUtils.isEmpty(cords)){
            log.warn("crop co-ordinates missing in jcr:content for: " + resource.getPath());
            return;
        }

        Layer layer = ImageHelper.createLayer(dataResource);
        Rectangle rect = ImageHelper.getCropRect(cords, resource.getPath());

        layer.crop(rect);

        OutputStream out = null;
        InputStream in = null;
        String mimeType = "image/png";

        try {
            File file = File.createTempFile("cropped", ".tmp");
            out = FileUtils.openOutputStream(file);

            layer.write(mimeType, 1.0, out);
            IOUtils.closeQuietly(out);

            in = FileUtils.openInputStream(file);
            Asset asset = DamUtil.resolveToAsset(resource);

            asset.addRendition("logo.png", in, mimeType);
            session.getSession().save();
        } finally {
            IOUtils.closeQuietly(in);
            IOUtils.closeQuietly(out);
        }
    }

    private Resource getResourceFromPayload(WorkItem item, Session session) {
        if (!item.getWorkflowData().getPayloadType().equals("JCR_PATH")) {
            return null;
        }

        String path = item.getWorkflowData().getPayload().toString();
        return factory.getResourceResolver(session).getResource(path);
    }
}
