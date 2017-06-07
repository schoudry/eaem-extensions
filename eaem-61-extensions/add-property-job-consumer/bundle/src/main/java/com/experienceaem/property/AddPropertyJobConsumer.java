package com.experienceaem.property;

import com.adobe.granite.workflow.event.WorkflowEvent;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.JobManager;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.service.event.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component(metatype = true, immediate = true)
@Service(value={JobConsumer.class})
@Property(name = JobConsumer.PROPERTY_TOPICS, value = { "com/experience-aem/assets" })
public class AddPropertyJobConsumer implements JobConsumer{
    private final Logger log = LoggerFactory.getLogger(getClass());

    private Map<String, AsyncHandler> asyncHandlers = new ConcurrentHashMap<String, AsyncHandler>();

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Reference
    private JobManager jobManager;

    public JobResult process(Job job){
        JobResult result = JobResult.FAILED;
        AsyncHandler asyncHandler = (AsyncHandler) job.getProperty(JobConsumer.PROPERTY_JOB_ASYNC_HANDLER);

        if (asyncHandler != null) {
            asyncHandlers.put(job.getId(), asyncHandler);
            result = JobResult.ASYNC;
        }

        return result;
    }

    public void handleEvent(Event event) {
        System.out.println(event.getTopic());
    }
}
