package apps.experienceaem.campaign;

import com.day.cq.commons.jcr.JcrConstants;
import com.day.cq.replication.ReplicationActionType;
import com.day.cq.replication.ReplicationOptions;
import com.day.cq.replication.ReplicationStatus;
import com.day.cq.replication.Replicator;
import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.reference.*;
import com.day.cq.wcm.api.reference.Reference;
import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.HistoryItem;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.WorkflowProcess;
import com.day.cq.workflow.metadata.MetaDataMap;
import com.day.cq.workflow.model.WorkflowNode;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.jcr.resource.JcrResourceResolverFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.SimpleCredentials;
import javax.jcr.security.AccessControlManager;
import javax.jcr.security.Privilege;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.apache.felix.scr.annotations.ReferenceCardinality.OPTIONAL_MULTIPLE;
import static org.apache.felix.scr.annotations.ReferencePolicy.DYNAMIC;

@Component
@Service(WorkflowProcess.class)
@Property(name = "process.label", value = "Experience AEM Publish Campaign for Page")
public class PublishCampaignStep implements WorkflowProcess {
    private final Logger log = LoggerFactory.getLogger(PublishCampaignStep.class);

    private static final String REPLICATE_AS_PARTICIPANT = "replicateAsParticipant";
    private static final String PROCESS_ARGS = "PROCESS_ARGS";

    private static final String PN_OFFERPATH = "offerPath";
    private static final String REF_CAMPAIGN = "campaign";
    private static final String LOCATION = "location";


    private static final String ARP = "com.day.cq.dam.commons.util.impl.AssetReferenceProvider";

    @org.apache.felix.scr.annotations.Reference(policy = ReferencePolicy.STATIC)
    private JcrResourceResolverFactory factory;

    @org.apache.felix.scr.annotations.Reference
    private Replicator replicator;

    @org.apache.felix.scr.annotations.Reference(
            referenceInterface = ReferenceProvider.class,
            cardinality = OPTIONAL_MULTIPLE,
            policy = DYNAMIC)
    private final List<ReferenceProvider> referenceProviders = new CopyOnWriteArrayList<ReferenceProvider>();

    protected void bindReferenceProviders(ReferenceProvider referenceProvider) {
        referenceProviders.add(referenceProvider);
    }

    protected void unbindReferenceProviders(ReferenceProvider referenceProvider) {
        referenceProviders.remove(referenceProvider);
    }

    @Override
    public void execute(WorkItem item, WorkflowSession session, MetaDataMap metaData)
            throws WorkflowException {
        try{
            Session userSession = session.getSession();
            ResourceResolver resolver = factory.getResourceResolver(userSession);

            Resource page = getResourceFromPayload(resolver, item, session.getSession());
            Resource jcrContent = resolver.getResource(page.getPath() + "/" + JcrConstants.JCR_CONTENT);

            Set<Reference> allReferences = new TreeSet<Reference>(new Comparator<Reference>() {
                public int compare(Reference o1, Reference o2) {
                    return o1.getResource().getPath().compareTo(o2.getResource().getPath());
                }
            });

            for (ReferenceProvider referenceProvider : referenceProviders) {
                allReferences.addAll(referenceProvider.findReferences(jcrContent));
            }

            Session participantSession = null;

            if (replicateAsParticipant(metaData)) {
                String approverId = resolveParticipantId(item, session);

                if (StringUtils.isNotEmpty(approverId)) {
                    participantSession = getParticipantSession(approverId, session);
                }
            }

            List<String> toPublish = getNotPublishedOrOutdatedReferences(page, allReferences, userSession);

            publishReferences(toPublish, (participantSession != null) ? participantSession : userSession);
        }catch(Exception e){
            throw new WorkflowException("Error publishing campaign", e);
        }
    }

    private Session getParticipantSession(String participantId, WorkflowSession session) {
        try {
            return session.getSession().impersonate(
                                new SimpleCredentials(participantId, new char[0]));
        } catch (Exception e) {
            log.warn(e.getMessage());
            return null;
        }
    }

    /**
     * See the session's history to find latest participant step or dynamic participant step and use it's current assignee
     * @param workItem
     * @param session
     * @return
     */
    private String resolveParticipantId(WorkItem workItem, WorkflowSession session) {
        List<HistoryItem> history = new ArrayList<HistoryItem>();

        try {
            history = session.getHistory(workItem.getWorkflow());

            for (int index = history.size() - 1; index >= 0; index--) {
                HistoryItem previous = history.get(index);
                String type = previous.getWorkItem().getNode().getType();

                if (type != null && (type.equals(WorkflowNode.TYPE_PARTICIPANT)
                        || type.equals(WorkflowNode.TYPE_DYNAMIC_PARTICIPANT))) {
                    return previous.getUserId();
                }
            }
        } catch (Exception e) {
            log.warn("Error getting participant id", e);
        }

        return null;
    }

    private boolean replicateAsParticipant(MetaDataMap args) {
        String processArgs = args.get(PROCESS_ARGS, String.class);

        if(StringUtils.isEmpty(processArgs)){
            return false;
        }

        String[] arguments = processArgs.split(",");

        for (String argument : arguments) {
            String[] split = argument.split("=");

            if (split.length == 2) {
                if (split[0].equalsIgnoreCase(REPLICATE_AS_PARTICIPANT)) {
                    return Boolean.parseBoolean(split[1]);
                }
            }
        }

        return false;
    }

    private List<String> getNotPublishedOrOutdatedReferences(Resource page, Set<Reference> allReferences,
                                            Session session){
        Resource resource = null;
        boolean canReplicate = false;

        List<String> toPublish = new ArrayList<String>();

        for (Reference reference : allReferences) {
            resource = reference.getResource();

            if (resource == null) {
                continue;
            }

            canReplicate = canReplicate(resource.getPath(), session);

            if(!canReplicate){
                log.warn("Skipping, No replicate permission on - " + resource.getPath());
                continue;
            }

            if(shouldReplicate(reference)){
                toPublish.add(resource.getPath());
            }

            if(reference.getType().equals(REF_CAMPAIGN)){
                collectCampaignReferences(resource.adaptTo(Page.class), toPublish, session, page);
            }
        }

        log.info("Publishing campaign assets - " + toPublish);

        return toPublish;
    }

    private boolean shouldReplicate(Reference reference){
        Resource resource = reference.getResource();
        ReplicationStatus replStatus = resource.adaptTo(ReplicationStatus.class);

        if (replStatus == null) {
            return true;
        }

        boolean doReplicate = false, published = false, outdated = false;
        long lastPublished = 0;

        published = replStatus.isDelivered() || replStatus.isActivated();

        if (published) {
            lastPublished = replStatus.getLastPublished().getTimeInMillis();
            outdated = lastPublished < reference.getLastModified();
        }

        if (!published || outdated) {
            doReplicate = true;
        }

        return doReplicate;
    }

    private void publishReferences(List<String> toPublish, Session session) throws Exception{
        ReplicationOptions opts = new ReplicationOptions();

        for(String path : toPublish){
            replicator.replicate(session, ReplicationActionType.ACTIVATE, path, opts);
        }
    }

    private void collectCampaignReferences(Page root, List<String> toPublish, Session session,
                                                Resource payloadPage) {
        ReferenceProvider assetReferenceProvider = null;

        for (ReferenceProvider referenceProvider : referenceProviders) {
            if(!(referenceProvider.getClass().getName().equals(ARP))){
                continue;
            }
            assetReferenceProvider = referenceProvider;
        }

        if(assetReferenceProvider == null){
            return;
        }

        Iterator<Page> experiences = root.listChildren();
        Page experience, offer; String assetPath;
        boolean canReplicate = false; String location;

        Resource contentRes = null;
        List<Reference> assetRefs = null;

        while(experiences.hasNext()) {
            experience = experiences.next();

            Iterator<Page> offers = experience.listChildren();

            while (offers.hasNext()) {
                offer = offers.next();

                contentRes = offer.getContentResource();

                location = contentRes.adaptTo(ValueMap.class).get(LOCATION, "");

                if(!location.startsWith(payloadPage.getPath() + "/jcr:content")){
                    log.debug("Publish campaign step skipping - " + offer.getPath());
                    continue;
                }

                toPublish.add(experience.getPath());

                toPublish.add(offer.getPath());

                ValueMap properties = offer.getProperties();
                String offerPath = properties.get(PN_OFFERPATH,"");

                if (StringUtils.isNotEmpty(offerPath)) {
                    toPublish.add(offerPath);
                }

                assetRefs = assetReferenceProvider.findReferences(contentRes);

                for(Reference ref : assetRefs){
                    assetPath = ref.getResource().getPath();
                    canReplicate = canReplicate(assetPath, session);

                    /*if(!canReplicate){
                        log.warn("Skipping, No replicate permission on - " + assetPath);
                        continue;
                    }

                    if(!shouldReplicate(ref)){
                        continue;
                    }*/

                    toPublish.add(assetPath);
                }
            }
        }
    }

    private static boolean canReplicate(String path, Session session) {
        try {
            AccessControlManager acMgr = session.getAccessControlManager();

            return acMgr.hasPrivileges(path, new Privilege[]{
                    acMgr.privilegeFromName(Replicator.REPLICATE_PRIVILEGE)
            });
        } catch (RepositoryException e) {
            return false;
        }
    }

    private Resource getResourceFromPayload(ResourceResolver resolver, WorkItem item,
                                            Session session) {
        if (!item.getWorkflowData().getPayloadType().equals("JCR_PATH")) {
            return null;
        }

        String path = item.getWorkflowData().getPayload().toString();

        return resolver.getResource(path);
    }
}
