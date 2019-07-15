package apps.experienceaem.assets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.request.RequestParameter;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.servlets.post.Modification;
import org.apache.sling.servlets.post.ModificationType;
import org.apache.sling.servlets.post.SlingPostProcessor;
import org.json.JSONObject;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

import javax.jcr.Item;
import javax.jcr.Node;
import javax.jcr.Property;
import javax.jcr.Session;
import java.util.List;

@Component(
        immediate = true,
        service = { SlingPostProcessor.class },
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
        }
)
public class EAEMBulkUpdateAppend implements SlingPostProcessor {
    private static final String MODE = "mode";
    private static final String MODE_SOFT = "soft";
    private static final String BULK_UPDATE = "dam:bulkUpdate";
    private static final String METADATA_KEY = "mdvm";

    private static final String DEFAULT_FOR_APPEND =  "eaemRequired" ;
    private static final String SEPARATOR_FOR_APPEND =  "," ;
    private static final int JCR_STRING_TYPE =  1 ;

    private String[] metadataForAppend = new String[] {DEFAULT_FOR_APPEND};

    @Activate
    protected void activate(EAEMBulkUpdateAppendConfiguration configuration) {
        metadataForAppend = configuration.metadataFields();
    }

    public void process(SlingHttpServletRequest request, List<Modification> modifications) throws Exception {
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

        for (RequestParameter asset : assets) {
            JSONObject assetJson = new JSONObject(asset.toString());

            for (Modification change : modifications) {
                if (!change.getType().equals(ModificationType.MODIFY)) {
                    continue;
                }

                processChanges(session, change, assetJson);
            }
        }

        session.save();
    }

    private void processChanges(Session session, Modification change, JSONObject assetJson) throws Exception{
        Item jcrItem = null;
        JSONObject metaJson = null, propJson = null;
        String assetPath = assetJson.getString("path");

        String source = change.getSource();

        if( (source == null) || (!source.startsWith(assetPath))){
            return;
        }

        jcrItem = session.getItem(source);

        if ( (jcrItem == null) ||  jcrItem.isNode()) {
            return;
        }

        String metadataPath = assetPath + "/jcr:content/metadata";

        if (assetJson.has(METADATA_KEY)) {
            metaJson = (JSONObject) assetJson.get(METADATA_KEY);
        }

        if(metaJson == null){
            return;
        }

        if (metaJson.has(metadataPath)) {
            propJson = (JSONObject) metaJson.get(metadataPath);
        }

        if(propJson == null){
            return;
        }

        Node metadataNode = session.getNode(metadataPath);
        String existingValue = null;
        Property metaProp = null;

        for(String prop : metadataForAppend) {
            if(!propJson.has(prop)){
                continue;
            }

            existingValue = propJson.getString(prop);

            if(metadataNode.hasProperty(prop)){
                metaProp = metadataNode.getProperty(prop);
            }

            if( metaProp != null ){
                if(metaProp.getType() != JCR_STRING_TYPE){
                    continue;
                }

                existingValue = existingValue + SEPARATOR_FOR_APPEND + metaProp.getString();
            }

            metadataNode.setProperty(prop, existingValue, JCR_STRING_TYPE);
        }
    }

    @ObjectClassDefinition(
        name = "EAEM Metadata fields",
        description = "EAEM Metadata fields for append mode"
    )
    public @interface EAEMBulkUpdateAppendConfiguration {

        @AttributeDefinition(
                name = "Metadata fields",
                description = "Metadata fields for append e.g. eaemRequired (service looks for this property of type STRING and ONLY in jcr:content/metadata)",
                defaultValue = { DEFAULT_FOR_APPEND },
                cardinality = 5
        )
        String[] metadataFields() default DEFAULT_FOR_APPEND;
    }
}
