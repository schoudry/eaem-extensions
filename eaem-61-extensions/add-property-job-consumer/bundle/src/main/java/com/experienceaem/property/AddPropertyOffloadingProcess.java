package com.experienceaem.property;

import com.adobe.granite.offloading.api.OffloadingJobProperties;
import com.adobe.granite.offloading.workflow.api.WorkflowOffloadingHelper;
import com.adobe.granite.offloading.workflow.api.WorkflowOffloadingProcessArguments;
import com.adobe.granite.offloading.workflow.api.WorkflowOffloadingProperties;
import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowExternalProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.commons.util.DamUtil;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.wrappers.ValueMapDecorator;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.JobManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.util.HashMap;

@Component
@Service
public class AddPropertyOffloadingProcess implements WorkflowExternalProcess {
    private final Logger log = LoggerFactory.getLogger(getClass());

    private static final String JCR_PATH = "JCR_PATH";

    @Reference
    private JobManager jobManager;

    @Override
    public Serializable execute(WorkItem workItem, WorkflowSession workflowSession, MetaDataMap metaDataMap)
            throws WorkflowException {
        Asset asset = getAsset(workItem, workflowSession, metaDataMap);

        ValueMap jobProperties = getAllJobProperties(asset, workItem, metaDataMap);

        String jobTopic = WorkflowOffloadingHelper.getJobTopic(metaDataMap);

        if (StringUtils.isEmpty(jobTopic)) {
            throw new WorkflowException("Empty job topic");
        }

        Job offloadingJob = jobManager.addJob(jobTopic, jobProperties);

        return offloadingJob.getId();
    }

    private ValueMap getAllJobProperties(Asset asset, WorkItem item, MetaDataMap metaDataMap)
                            throws WorkflowException {
        ValueMap allJobProperties = new ValueMapDecorator(new HashMap<String, Object>());

        String workflowModel = WorkflowOffloadingHelper.getWorkflowModel(metaDataMap);

        if (StringUtils.isEmpty(workflowModel)) {
            throw new WorkflowException("No workflow model specified, cannot execute workflow.");
        }

        String workflowPayload = asset.getOriginal().getPath();

        allJobProperties.put(WorkflowOffloadingProperties.OFFLOADING_WORKFLOW_MODEL.getPropertyName(),
                            workflowModel);

        allJobProperties.put(WorkflowOffloadingProperties.OFFLOADING_WORKFLOW_PAYLOAD.getPropertyName(),
                            workflowPayload);

        allJobProperties.putAll(WorkflowOffloadingHelper.getJobProperties(metaDataMap));

        String workflowOffloadingInput = WorkflowOffloadingHelper.getWorkflowOffloadingInput(metaDataMap,
                                            asset.getPath(), workflowModel);
        allJobProperties.put(OffloadingJobProperties.INPUT_PAYLOAD.propertyName(), workflowOffloadingInput);

        String workflowOffloadingOutput = WorkflowOffloadingHelper.getWorkflowOffloadingOutput(metaDataMap,
                                            asset.getPath(), workflowModel);
        allJobProperties.put(OffloadingJobProperties.OUTPUT_PAYLOAD.propertyName(), workflowOffloadingOutput);

        return allJobProperties;
    }

    private Asset getAsset(WorkItem item, WorkflowSession wfSession, MetaDataMap metaDataMap) {
        Asset asset = null;

        String payload = metaDataMap.get(WorkflowOffloadingProcessArguments.WORKFLOW_PAYLOAD.getArgumentName(),
                                        String.class);

        if (StringUtils.isBlank(payload)) {
            if (item.getWorkflowData().getPayloadType().equals(JCR_PATH)) {
                payload = item.getWorkflowData().getPayload().toString();
            }
        }

        ResourceResolver resolver = wfSession.adaptTo(ResourceResolver.class);
        Resource resource = resolver.getResource(payload);

        if (null != resource) {
            asset = DamUtil.resolveToAsset(resource);
        } else {
            log.error("asset {} in payload of workflow {} does not exist.", payload,
                            item.getWorkflow().getId());
        }

        return asset;
    }


    @Override
    public boolean hasFinished(Serializable serializable, WorkItem workItem, WorkflowSession workflowSession, MetaDataMap metaDataMap) {
        return false;
    }

    @Override
    public void handleResult(Serializable serializable, WorkItem workItem, WorkflowSession workflowSession, MetaDataMap metaDataMap) throws WorkflowException {
    }
}
