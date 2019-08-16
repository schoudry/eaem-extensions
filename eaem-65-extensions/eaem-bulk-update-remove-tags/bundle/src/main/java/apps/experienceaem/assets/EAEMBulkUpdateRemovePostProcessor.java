package apps.experienceaem.assets;

import org.apache.commons.lang.ArrayUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.request.RequestParameter;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.servlets.post.Modification;
import org.apache.sling.servlets.post.SlingPostProcessor;
import org.json.JSONObject;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;

import javax.jcr.*;
import java.util.*;

@Component(
        immediate = true,
        service = { SlingPostProcessor.class },
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99"
        }
)
public class EAEMBulkUpdateRemovePostProcessor implements SlingPostProcessor {
    private static final String MODE = "mode";
    private static final String MODE_SOFT = "soft";
    private static final String BULK_UPDATE = "dam:bulkUpdate";
    private static final String EAEM_REMOVE_SUFFIX = "-eaem-remove";

    public void process(SlingHttpServletRequest request, List<Modification> modifications) throws Exception {
        ResourceResolver resolver = request.getResourceResolver();
        String reqType = request.getParameter(BULK_UPDATE);
        String reqMode = request.getParameter(MODE);

        if ((reqType == null) || (reqMode == null) || !reqMode.equals(MODE_SOFT)) {
            return;
        }

        Session session = resolver.adaptTo(Session.class);
        RequestParameter[] assets = request.getRequestParameters("asset");

        if ( (session == null) || (assets == null)) {
            return;
        }

        session.refresh(true);

        Map<String, String[]> removalMap = getValuesForRemoval(request);

        if(removalMap.isEmpty()){
            return;
        }

        for (RequestParameter asset : assets) {
            JSONObject assetJson = new JSONObject(asset.toString());

            processChanges(session, assetJson, removalMap);
        }

        session.save();
    }

    private Map<String, String[]> getValuesForRemoval(SlingHttpServletRequest request){
        Map<String, String[]> removalMap = new HashMap<String, String[]>();

        Map<String, String[]> params = request.getParameterMap();
        String removeKey = null;
        String[] removeValues = null;

        for(String param : params.keySet()){
            if(!param.endsWith(EAEM_REMOVE_SUFFIX)) {
                continue;
            }

            removeKey = param.substring(0, param.lastIndexOf(EAEM_REMOVE_SUFFIX));

            removeValues = params.get(removeKey);

            if(removeValues == null){
                continue;
            }

            removalMap.put(removeKey.substring(removeKey.lastIndexOf("/") + 1), removeValues);
        }

        return removalMap;
    }

    private void processChanges(Session session, JSONObject assetJson, Map<String, String[]> removalMap)
                        throws Exception{
        String assetPath = assetJson.getString("path");
        String metadataPath = assetPath + "/jcr:content/metadata";

        Node metadataNode = session.getNode(metadataPath);
        String removePropertyName;
        Property property;

        for(String removeKey : removalMap.keySet()){
            if(!metadataNode.hasProperty(removeKey)){
                continue;
            }

            property = metadataNode.getProperty(removeKey);

            if(!property.isMultiple()){
                continue;
            }

            Value values[] = getNewValues(property.getValues(), Arrays.asList(removalMap.get(removeKey)));

            if(ArrayUtils.isEmpty(values)){
                property.remove();
            }else{
                metadataNode.setProperty(removeKey, values);
            }

            removePropertyName = removeKey + EAEM_REMOVE_SUFFIX;

            if(metadataNode.hasProperty(removePropertyName)){
                metadataNode.getProperty(removePropertyName).remove();
            }
        }
    }

    private Value[] getNewValues(Value[] oldValues, List<String> removeValues) throws Exception{
        List<Value> newValues = new ArrayList<Value>();

        for(Value value : oldValues){
            if(removeValues.contains(value.getString())){
                continue;
            }

            newValues.add(value);
        }

        return newValues.toArray(new Value[newValues.size()]);
    }
}