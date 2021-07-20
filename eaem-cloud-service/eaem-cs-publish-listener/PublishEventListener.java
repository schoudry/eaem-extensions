package com.adobe.psa.demo.core.listeners;

import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobe.psa.demo.core.utils.ResolverUtil;
import com.day.cq.dam.api.Asset;
import com.day.cq.wcm.api.Page;


@Component(immediate = true,
	service = EventHandler.class,
	property = {
	        "event.topics=org/apache/sling/distribution/agent/package/distributed"
})
public class PublishEventListener implements EventHandler {
	
	public static final String PROPERTY_EVENT_TOPICS = "event.topics";
	public static final String PROPERTY_DISTRIBUTION_TYPE = "distribution.type";
	public static final String PROPERTY_DISTRIBUTION_TYPE_ADD = "ADD";
	public static final String PROPERTY_DISTRIBUTION_TYPE_DELETE = "DELETE";
	
	public static final String PROPERTY_DISTRIBUTION_PATH = "distribution.paths";
	
	@Reference
	ResourceResolverFactory resolverFactory;
	
	public static final Logger logger = LoggerFactory.getLogger(PublishEventListener.class);

	@Override
	public void handleEvent(Event event) {
		
		
		logger.debug("Resource event: {} at: {}", event.getProperty(PROPERTY_EVENT_TOPICS), event.getProperty(PROPERTY_DISTRIBUTION_PATH));
		logger.debug("Resource event type: {}", event.getProperty(PROPERTY_DISTRIBUTION_TYPE));
		
		String[] paths = (String[]) event.getProperty(PROPERTY_DISTRIBUTION_PATH);
		String distType = event.getProperty(PROPERTY_DISTRIBUTION_TYPE).toString();
			
		ResourceResolver resolver = null;
		try {
			
			resolver = ResolverUtil.getResourceResolverObject(resolverFactory);
		}
		catch (LoginException e) {
			logger.error("service user is missing");
			e.printStackTrace();
		}
		
		if(resolver != null) {
			//it has real path, move forward with the logic
			if(paths != null) {
				for(String path : paths) {
					Resource resource = resolver.getResource(path);
					
					//it is an asset
					Asset asset = null != resource ? resource.adaptTo(Asset.class) : null;
					if(asset != null) {
						String uuid = null != asset ? asset.getID() : null;
			
						logger.debug("Activated resource id: {}", uuid);
						
						if(PROPERTY_DISTRIBUTION_TYPE_ADD.equalsIgnoreCase(distType)) //process publish event
							processPublishEvent();
						else if(PROPERTY_DISTRIBUTION_TYPE_DELETE.equalsIgnoreCase(distType)) //process unpublish event
							processUnpublishEvent();
					}
					
					//it is a page, add page related logic here
					Page page = null != resource ? resource.adaptTo(Page.class) : null;
					if(page != null) {
						String pageName = page.getName();
						logger.debug("Page name: {}", pageName);
						
						if(PROPERTY_DISTRIBUTION_TYPE_ADD.equalsIgnoreCase(distType)) //process publish event
							processPublishEvent();
						else if(PROPERTY_DISTRIBUTION_TYPE_DELETE.equalsIgnoreCase(distType)) //process unpublish event
							processUnpublishEvent();
					}
					
					//if it is Experience fragment
					
				}
			}
		}
		
	}
	
	private void processPublishEvent() {
		logger.info("Process Publish event");
		//add the real logic here, such as notitying external service
	}
	
	private void processUnpublishEvent() {
		logger.info("Process Unpublish event");
		//add the real logic here, such as notitying external service
	}

}
