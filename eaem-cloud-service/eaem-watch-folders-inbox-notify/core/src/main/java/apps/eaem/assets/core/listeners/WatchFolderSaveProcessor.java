package apps.eaem.assets.core.listeners;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.servlets.post.Modification;
import org.apache.sling.servlets.post.SlingPostProcessor;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Component(
        immediate = true,
        service = { SlingPostProcessor.class },
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
        }
)
public class WatchFolderSaveProcessor implements SlingPostProcessor {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    private static final String OPERATION = "operation";
    private static final String OPERATION_DAM_SHARE_FOLDER = "dam.share.folder";
    private static final String WATCH_FOLDER = "eaemWatch";

    @Override
    public void process(final SlingHttpServletRequest request, final List<Modification> modifications){
        try {
            final String operation = request.getParameter(OPERATION);
            final String operationDamShareFolder = request.getParameter(OPERATION_DAM_SHARE_FOLDER);

            if ( operation == null || operationDamShareFolder == null || !operation.equals(operationDamShareFolder)) {
                return;
            }

            final ResourceResolver resolver = request.getResourceResolver();
            final String watchFolder = request.getParameter(WATCH_FOLDER);

            if (!"true".equals(watchFolder)) {
                return;
            }
        } catch (Exception e) {
            logger.error("Error saving folder watch", e);
        }
    }
}
