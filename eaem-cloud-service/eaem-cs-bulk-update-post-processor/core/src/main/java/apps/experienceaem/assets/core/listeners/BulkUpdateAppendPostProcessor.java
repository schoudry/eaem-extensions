package apps.experienceaem.assets.core.listeners;

import org.apache.commons.lang.ArrayUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.request.RequestParameter;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.servlets.post.Modification;
import org.apache.sling.servlets.post.ModificationType;
import org.apache.sling.servlets.post.SlingPostProcessor;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.*;
import java.util.ArrayList;
import java.util.List;

@Component(
        immediate = true,
        service = { SlingPostProcessor.class },
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
        }
)
public class BulkUpdateAppendPostProcessor implements SlingPostProcessor {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    private static final String MODE = "mode";
    private static final String MODE_SOFT = "soft";
    private static final String BULK_UPDATE = "dam:bulkUpdate";

    public void process(SlingHttpServletRequest request, List<Modification> modifications) throws Exception {
        try{
            ResourceResolver resolver = request.getResourceResolver();
            String reqType = request.getParameter(BULK_UPDATE);
            String reqMode = request.getParameter(MODE);

            if ( (reqType == null) || (reqMode == null) || !reqMode.equals(MODE_SOFT)) {
                return;
            }

            Session session = resolver.adaptTo(Session.class);
            RequestParameter[] assets = request.getRequestParameters("asset");

            if ( (session == null) || (assets == null)) {
                return;
            }

            for (Modification change : modifications) {
                if (!change.getType().equals(ModificationType.MODIFY)) {
                    continue;
                }

                processChanges(session, change);
            }

            session.save();
        } catch (Exception e) {
            logger.error("Error updating multi valued properties during bulk edit", e);
        }
    }

    private void processChanges(Session session, Modification change) throws Exception{
        Item jcrItem = null;

        String changedMetadataPath = change.getSource();

        if( changedMetadataPath == null ){
            return;
        }

        jcrItem = session.getItem(changedMetadataPath);

        if ( (jcrItem == null) ||  jcrItem.isNode()) {
            return;
        }

        Node metadataNode = null;
        Property metaProp = null;

        String changedMetadataNodePath = changedMetadataPath.substring(0, changedMetadataPath.lastIndexOf("/"));
        String changedPropName = changedMetadataPath.substring(changedMetadataPath.lastIndexOf("/") + 1);

        if(!session.itemExists(changedMetadataNodePath)){
            return;
        }

        metadataNode = session.getNode(changedMetadataNodePath);
        metaProp = metadataNode.getProperty(changedPropName);

        if(!metaProp.isMultiple()){
            return;
        }

        Value values[] = getNewTagValues(metaProp.getValues());

        if(ArrayUtils.isEmpty(values)){
            metaProp.remove();
        }else{
            metadataNode.setProperty(changedPropName, values);
        }
    }

    private Value[] getNewTagValues(Value[] oldValues) throws Exception{
        List<Value> newValues = new ArrayList<Value>();
        List<String> existingTags = new ArrayList<String>();

        for(Value value : oldValues){
            if(existingTags.contains(value.getString())){
                continue;
            }

            newValues.add(value);
            existingTags.add(value.getString());
        }

        return newValues.toArray(new Value[newValues.size()]);
    }
}
