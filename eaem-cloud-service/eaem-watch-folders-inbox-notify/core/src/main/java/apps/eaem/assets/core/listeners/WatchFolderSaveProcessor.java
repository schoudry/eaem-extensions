package apps.eaem.assets.core.listeners;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.servlets.post.Modification;
import org.apache.sling.servlets.post.SlingPostProcessor;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
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

            Session session = resolver.adaptTo(Session.class);
            /*ValueFactory valueFactory = session.getValueFactory();

            final String folderPath = request.getRequestPathInfo().getSuffix();
            Node jcrContent = resolver.getResource(folderPath).getChild("jcr:content").adaptTo(Node.class);

            Property watchProp = jcrContent.getProperty(WATCH_FOLDER);
            Value thisUser = valueFactory.createValue(session.getUserID());
            Value values[] = ((watchProp == null) ? new Value[] { thisUser } : ArrayUtils.add(watchProp.getValues(), thisUser));

            jcrContent.setProperty(WATCH_FOLDER, values);*/
        } catch (Exception e) {
            logger.error("Error saving folder watch", e);
        }
    }
}
