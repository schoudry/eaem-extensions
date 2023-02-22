package apps.eaem.assets.core.listeners;

import com.day.cq.dam.api.Asset;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.servlets.post.Modification;
import org.apache.sling.servlets.post.SlingPostProcessor;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import java.io.IOException;
import java.util.List;

@Component(
        immediate = true,
        service = { SlingPostProcessor.class },
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
        }
)
public class SaveAndSendPostProcessor implements SlingPostProcessor {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    private static final String MODE = "mode";
    private static final String MODE_HARD = "hard";
    private static final String BULK_UPDATE = "dam:bulkUpdate";
    private static final String EAEM_SEND_TO_THIRD_PARTY = "eaem-send-to-third-party";

    @Override
    public void process(final SlingHttpServletRequest request, final List<Modification> modifications){
        try {
            final String reqType = request.getParameter(BULK_UPDATE);
            final String reqMode = request.getParameter(MODE);

            if ( reqType == null || reqMode == null || !reqMode.equals(MODE_HARD)) {
                return;
            }

            final Session session = request.getResourceResolver().adaptTo(Session.class);
            final String sendToDamExchange = request.getParameter(EAEM_SEND_TO_THIRD_PARTY);

            if ( session == null || !"true".equals(sendToDamExchange)) {
                return;
            }

            final String assetPath = request.getRequestURI();
            final Resource assetResource = request.getResourceResolver().getResource(assetPath);
            final Asset asset = assetResource.adaptTo(Asset.class);
            final String metadataJson = new ObjectMapper().writeValueAsString(assetResource.getChild("jcr:content/metadata").getValueMap());

            //make a https request to third party and post metadataJson
        } catch (JsonProcessingException e) {
            logger.error("JsonProcessingException sending data to Third Party", e);
        } catch (IOException ex) {
            logger.error("Error sending data to Third Party", ex);
        }
    }
}

