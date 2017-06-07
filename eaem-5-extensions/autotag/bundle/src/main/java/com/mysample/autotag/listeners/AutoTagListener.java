package com.mysample.autotag.listeners;

import com.day.cq.tagging.JcrTagManagerFactory;
import com.day.cq.tagging.Tag;
import com.day.cq.tagging.TagManager;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Reference;
import org.apache.sling.jcr.api.SlingRepository;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.observation.Event;
import javax.jcr.observation.EventIterator;
import javax.jcr.observation.EventListener;
import javax.jcr.observation.ObservationManager;

@Component
public class AutoTagListener implements EventListener {
    private final Logger LOGGER = LoggerFactory.getLogger(AutoTagListener.class);

    private static final String NAMESPACE = "/etc/tags/mysample";

    @Reference
    private SlingRepository repository;

    @Reference
    JcrTagManagerFactory tmf;

    private Session session;
    private ObservationManager observationManager;

    protected void activate(ComponentContext context) throws Exception {
        session = repository.loginAdministrative(null);
        observationManager = session.getWorkspace().getObservationManager();

        observationManager.addEventListener(this, Event.NODE_ADDED, "/", true, null,
                null, true);
        LOGGER.info("Added JCR event listener - AutoTagListener");
    }

    protected void deactivate(ComponentContext componentContext) {
        try {
            if (observationManager != null) {
                observationManager.removeEventListener(this);
                LOGGER.info("Removed JCR event listener - AutoTagListener");
            }
        } catch (RepositoryException re) {
            LOGGER.error("Error removing the JCR event listener - AutoTagListener", re);
        } finally {
            if (session != null) {
                session.logout();
                session = null;
            }
        }
    }

    public void onEvent(EventIterator it) {
        try {
            while (it.hasNext()) {
                Event event = it.nextEvent();
                LOGGER.info("AutoTagListener - new add event: ", event.getPath());

                Node pageContentNode = session.getNode(event.getPath());

                if( ( pageContentNode == null ) || !pageContentNode.getPrimaryNodeType().isNodeType("cq:PageContent")){
                    LOGGER.debug("Skip processing node: " + event.getPath());
                    return;
                }

                Node pageNode = pageContentNode.getParent();

                if( ( pageNode == null ) || !pageNode.getPrimaryNodeType().isNodeType("cq:Page")){
                    LOGGER.debug("Skip processing node: " + pageNode);
                    return;
                }

                TagManager tMgr = tmf.getTagManager(session);
                Tag superTag = tMgr.resolve(NAMESPACE);
                Tag tag = null;

                if(superTag == null){
                    tag = tMgr.createTag(NAMESPACE, "My Sample", "My Sample tags", true);
                    LOGGER.info("Tag Name Space created : ", tag.getPath());
                }

                tag = tMgr.createTag(NAMESPACE + "/" + pageNode.getName(), pageNode.getName(), "Auto tag : " + pageNode.getName(), true);

                String tagArray[] = new String[1];
                tagArray[0] = tag.getNamespace().getName() + ":" + tag.getPath().substring(tag.getPath().indexOf(NAMESPACE) + NAMESPACE.length() + 1);

                pageContentNode.setProperty("cq:tags", tagArray);
                session.save();
            }
        }catch (Exception e) {
            LOGGER.error(e.getMessage(), e);
        }

        return;
    }
}

