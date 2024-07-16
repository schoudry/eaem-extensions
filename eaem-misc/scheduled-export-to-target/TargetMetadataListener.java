package com.adobe.aem.listeners;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.nodetype.NodeType;
import javax.jcr.observation.Event;
import javax.jcr.observation.EventIterator;
import javax.jcr.observation.EventListener;

import org.apache.jackrabbit.api.observation.JackrabbitEventFilter;
import org.apache.jackrabbit.api.observation.JackrabbitObservationManager;
import org.apache.sling.jcr.api.SlingRepository;
import org.apache.sling.serviceusermapping.ServiceUserMapped;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
		service = TargetMetadataListener.class,
		immediate = true,
		property = {
			"service.description=Target Metadata listener"
		},
		reference = {
			@Reference(
				name = "target-metadata-change-listener",
				service = ServiceUserMapped.class,
				target = "(subServiceName=target-metadata-change-listener)"
			)
		}
		)
public class TargetMetadataListener implements EventListener {
	private static final Logger LOG = LoggerFactory.getLogger(TargetMetadataListener.class);
	static final String TARGET_METADATA_LISTENER_SERVICE = "target-metadata-change-listener";
	@Reference
	private SlingRepository repository = null;
	@SuppressWarnings({"AEM Rules:AEM-3", "AEM Rules:AEM-7"})
	private Session session;

	private final String LIVE_SYNC_CANCELLED_MIXIN = "cq:LiveSyncCancelled";

	@Activate
	protected void activate() {
		try {
			session = repository.loginService(TARGET_METADATA_LISTENER_SERVICE, null);
			if (session != null) {
				JackrabbitObservationManager observationManager = (JackrabbitObservationManager) session.getWorkspace()
						.getObservationManager();
				JackrabbitEventFilter filter = new JackrabbitEventFilter()
						.setNodeTypes(new String[] { "nt:unstructured" }).setAbsPath("/content/experience-fragments")
						.setEventTypes(Event.NODE_ADDED).setIsDeep(true);
				observationManager.addEventListener(this, filter);
				LOG.info("Target Metadata listener for ExperienceFragments is registered successfully.");
			}
		} catch (RepositoryException e) {
			LOG.error("RepositoryException: ", e);
		} catch (Exception e) {
			LOG.error("Exception: ", e);
		}
	}

	@Deactivate
	protected void deactivate() {
		if (session != null) {
			try {
				session.getWorkspace().getObservationManager().removeEventListener(this);
			} catch (RepositoryException e) {
				LOG.warn("Error during unregistering event listener: " + e.getMessage(), e);
			}
			session.logout();
			session = null;
		}
	}

	private boolean exists(NodeType mixins[], String mixin) {
		if (mixins == null || mixins.length == 0) {
			return false;
		}
		for (NodeType m : mixins) {
			if (m.getName().equals(mixin)) {
				return true;
			}
		}
		return false;
	}

	@Override
	public void onEvent(EventIterator events) {
		try {
			try {
				session.refresh(false);
			} catch (RepositoryException e) {
				LOG.warn("Error during rereshing the session: " + e.getMessage(), e);
			}
			while (events.hasNext()) {
				Event event = events.nextEvent();
				String path = event.getPath();
				Node node = session.getNode(path);
				if ("cq:targetMetadata".equals(node.getName())) {
					NodeType mixins[] = node.getMixinNodeTypes();
					if (!exists(mixins, LIVE_SYNC_CANCELLED_MIXIN)) {
						node.addMixin(LIVE_SYNC_CANCELLED_MIXIN);
						session.save();
						LOG.info("Added cq:LiveSyncCancelled mixin to node: {}", path);
					}

				}
			}
		} catch (RepositoryException e) {
			LOG.error("RepositoryException: ", e);
		} catch (Exception e) {
			LOG.error("Exception: ", e);
		}
	}
}