package apps.eaem.assets.core.listeners;

import com.adobe.granite.taskmanagement.Task;
import com.adobe.granite.taskmanagement.TaskAction;
import com.adobe.granite.taskmanagement.TaskManager;
import com.adobe.granite.workflow.exec.InboxItem;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.apache.sling.api.resource.observation.ResourceChangeListener;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.*;
import java.util.*;

import static apps.eaem.assets.core.listeners.WatchFolderSaveProcessor.WATCH_FOLDER;
import static org.apache.sling.api.resource.observation.ResourceChangeListener.*;

@Component(
        service = ResourceChangeListener.class,
        immediate = true,
        property = {
                CHANGES + "=" + CHANGE_ADDED,
                CHANGES + "=" + CHANGE_REMOVED,
                PATHS + "=glob:/content/dam"
        })
public class AssetsAddedInFolderListener implements ResourceChangeListener {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private static final String EAEM_SERVICE_USER = "eaem-service-user";
    private static final String ORIGINAL_RENDITION_PATH = "/jcr:content/renditions/original";
    public static final String NOTIFICATION_TASK_TYPE = "Notification";

    @Reference
    private ResourceResolverFactory resolverFactory;

    public void onChange(List<ResourceChange> changes) {
        String assetPath = null;
        Iterator<ResourceChange> changesItr = changes.iterator();
        ResourceChange change = null;
        ResourceResolver resolver = getServiceResourceResolver(resolverFactory);

        while(changesItr.hasNext()){
            change = changesItr.next();

            if(change.getType() == ResourceChange.ChangeType.REMOVED){
                assetPath = change.getPath();
                break;
            }else if(change.getPath().endsWith(ORIGINAL_RENDITION_PATH)) {
                assetPath = change.getPath();
                assetPath = assetPath.substring(0, assetPath.indexOf(ORIGINAL_RENDITION_PATH));
                break;
            }
        };

        if(StringUtils.isEmpty(assetPath)){
            return;
        }

        String parentPath = assetPath.substring(0, assetPath.lastIndexOf("/"));

        try{
            Resource parentFolder = resolver.getResource(parentPath);
            Node jcrContent = parentFolder.getChild("jcr:content").adaptTo(Node.class);

            if(!jcrContent.hasProperty(WATCH_FOLDER)){
                return;
            }

            Property watchProp = jcrContent.getProperty(WATCH_FOLDER);
            Value values[] = watchProp.getValues();

            for(Value v : values){
                if(change.getType() == ResourceChange.ChangeType.REMOVED){
                    createAssetRemovedNotification(resolver, assetPath, v.getString());
                }else if(change.getType() == ResourceChange.ChangeType.ADDED){
                    createAssetAddedNotification(resolver.getResource(assetPath), v.getString());
                }
            }
        }catch (Exception ex) {
            logger.error("Error Creating Task", ex);
        }
    }

    private Task createAssetRemovedNotification(ResourceResolver resolver, String resourcePath, String assignee) throws Exception{
        TaskManager taskManager = resolver.adaptTo(TaskManager.class);
        Task task = taskManager.getTaskManagerFactory().newTask(NOTIFICATION_TASK_TYPE);
        String assetName = resourcePath.substring(resourcePath.lastIndexOf("/") + 1);
        String folderPath = resourcePath.substring(0, resourcePath.lastIndexOf("/"));

        task.setName(assetName);
        task.setContentPath(resourcePath);
        task.setDescription("Asset '" + assetName + "' removed from folder '" + folderPath
                + "'. You are receiving this notification because you have watch enabled on the folder");
        task.setCurrentAssignee(assignee);
        task.setPriority(InboxItem.Priority.LOW);

        taskManager.createTask(task);

        return task;
    }

    private Task createAssetAddedNotification(Resource resource, String assignee) throws Exception{
        ResourceResolver resolver = resource.getResourceResolver();
        TaskManager taskManager = resolver.adaptTo(TaskManager.class);
        Task task = taskManager.getTaskManagerFactory().newTask(NOTIFICATION_TASK_TYPE);

        task.setName(resource.getName());
        task.setContentPath(resource.getPath());
        task.setDescription("Asset '" + resource.getName() + "' uploaded to folder '" + resource.getParent().getPath()
                        + "'. You are receiving this notification because you have watch enabled on the folder");
        task.setCurrentAssignee(assignee);
        task.setPriority(InboxItem.Priority.LOW);

        taskManager.createTask(task);

        return task;
    }

    private ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            logger.error("Could not login as SubService user {}", EAEM_SERVICE_USER, ex);
            return null;
        }
    }
}
