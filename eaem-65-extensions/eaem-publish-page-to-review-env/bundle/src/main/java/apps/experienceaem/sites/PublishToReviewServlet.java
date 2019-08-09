package apps.experienceaem.sites;

import com.day.cq.commons.jcr.JcrConstants;
import com.day.cq.replication.*;
import com.day.cq.wcm.api.reference.ReferenceProvider;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.post.JSONResponse;
import org.json.JSONObject;
import org.osgi.service.component.annotations.Component;
import com.day.cq.wcm.api.reference.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.security.AccessControlManager;
import javax.jcr.security.Privilege;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Component(
        name = "Experience AEM Publish to Review Servlet",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=GET",
                "sling.servlet.paths=/bin/eaem/sites/review/status",
                "sling.servlet.paths=/bin/eaem/sites/review/publish"
        }
)
public class PublishToReviewServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(PublishToReviewServlet.class);

    public static final String PUBLISH_TO_REVIEW_URL = "/bin/eaem/sites/review/publish";
    public static final String STATUS_URL = "/bin/eaem/sites/review/status";

    private static final String REVIEW_AGENT = "review_agent";
    private static final String REVIEW_STATUS = "reviewStatus";
    private static final String REVIEW_STATUS_IN_PROGRESS = "IN_PROGRESS";

    @org.osgi.service.component.annotations.Reference
    Replicator replicator;

    @org.osgi.service.component.annotations.Reference(
            service = ReferenceProvider.class,
            cardinality = ReferenceCardinality.MULTIPLE,
            policy = ReferencePolicy.DYNAMIC)
    private final List<ReferenceProvider> referenceProviders = new CopyOnWriteArrayList<ReferenceProvider>();

    protected void bindReferenceProviders(ReferenceProvider referenceProvider) {
        referenceProviders.add(referenceProvider);
    }

    protected void unbindReferenceProviders(ReferenceProvider referenceProvider) {
        referenceProviders.remove(referenceProvider);
    }

    @Override
    protected final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
            ServletException, IOException {
        try {
            addJSONHeaders(response);

            if(PUBLISH_TO_REVIEW_URL.equals(request.getRequestPathInfo().getResourcePath())){
                handlePublish(request, response);
            }else{
                handleStatus(request, response);
            }
        } catch (Exception e) {
            log.error("Error processing publish to review...");
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void handleStatus(SlingHttpServletRequest request, SlingHttpServletResponse response) throws Exception {
        JSONObject jsonObject = new JSONObject();

        String parentPath = request.getParameter("parentPath");

        if(StringUtils.isEmpty(parentPath)){
            jsonObject.put("error", "No parent path provided");
            jsonObject.write(response.getWriter());
            return;
        }

        ResourceResolver resolver = request.getResourceResolver();
        Session session = resolver.adaptTo(Session.class);

        if ((session != null) && session.isLive() && !session.nodeExists(parentPath)) {
            log.debug("No such node {} ", parentPath);
            return;
        }

        jsonObject = getReviewInProgressPages(resolver.getResource(parentPath));

        jsonObject.write(response.getWriter());
    }

    private JSONObject getReviewInProgressPages(Resource resource) throws Exception{
        final JSONObject pagePaths = new JSONObject();

        final Iterator<Resource> childResItr = resource.listChildren();
        Resource childRes, jcrContent;
        Node jcrContentNode;

        while (childResItr.hasNext()) {
            childRes = childResItr.next();

            if(childRes.getName().equals("jcr:content")){
                jcrContent = childRes;
            }else{
                jcrContent = childRes.getChild("jcr:content");
            }

            if(jcrContent == null){
                continue;
            }

            jcrContentNode = jcrContent.adaptTo(Node.class);

            if (!jcrContentNode.hasProperty(REVIEW_STATUS)
                    || !jcrContentNode.getProperty(REVIEW_STATUS).getString().equals(REVIEW_STATUS_IN_PROGRESS)) {
                continue;
            }

            if(childRes.getName().equals("jcr:content")){
                pagePaths.put(childRes.getParent().getPath(), REVIEW_STATUS_IN_PROGRESS);
            }else{
                pagePaths.put(childRes.getPath(), REVIEW_STATUS_IN_PROGRESS);
            }
        }

        return pagePaths;
    }


    private void handlePublish(SlingHttpServletRequest request, SlingHttpServletResponse response) throws Exception {
        JSONObject jsonResponse = new JSONObject();
        List<String> publishPaths = new ArrayList<String>();

        ResourceResolver resolver = request.getResourceResolver();
        Session session = resolver.adaptTo(Session.class);
        String pagePaths = request.getParameter("pagePaths");

        for(String pagePath : pagePaths.split(",")){
            Resource page = resolver.getResource(pagePath);
            Resource jcrContent = resolver.getResource(page.getPath() + "/" + JcrConstants.JCR_CONTENT);

            Set<Reference> allReferences = new TreeSet<Reference>(new Comparator<Reference>() {
                public int compare(Reference o1, Reference o2) {
                    return o1.getResource().getPath().compareTo(o2.getResource().getPath());
                }
            });

            for (ReferenceProvider referenceProvider : referenceProviders) {
                allReferences.addAll(referenceProvider.findReferences(jcrContent));
            }

            for (Reference reference : allReferences) {
                Resource resource = reference.getResource();

                if (resource == null) {
                    continue;
                }

                boolean canReplicate = canReplicate(resource.getPath(), session);

                if(!canReplicate){
                    log.warn("Skipping, No replicate permission on - " + resource.getPath());
                    continue;
                }

                if(shouldReplicate(reference)){
                    publishPaths.add(resource.getPath());
                }
            }

            jcrContent.adaptTo(Node.class).setProperty(REVIEW_STATUS, REVIEW_STATUS_IN_PROGRESS);

            publishPaths.add(pagePath);
        }

        session.save();

        doReplicate(publishPaths, session);

        jsonResponse.put("success", "true");

        response.getWriter().write(jsonResponse.toString());
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

    private boolean shouldReplicate(Reference reference){
        Resource resource = reference.getResource();
        ReplicationStatus replStatus = resource.adaptTo(ReplicationStatus.class);

        if (replStatus == null) {
            return true;
        }

        boolean doReplicate = false, published = false, outdated = false;
        long lastPublished = 0;

        published = replStatus.isActivated();

        if (published) {
            lastPublished = replStatus.getLastPublished().getTimeInMillis();
            outdated = lastPublished < reference.getLastModified();
        }

        if (!published || outdated) {
            doReplicate = true;
        }

        return doReplicate;
    }

    private void doReplicate(List<String> paths, Session session) throws Exception{
        ReplicationOptions opts = new ReplicationOptions();

        opts.setFilter(new AgentFilter() {
            public boolean isIncluded(com.day.cq.replication.Agent agent) {
                return agent.getId().equalsIgnoreCase(REVIEW_AGENT);
            }
        });

        for(String path : paths){
            replicator.replicate(session, ReplicationActionType.ACTIVATE, path, opts);
        }
    }

    public static void addJSONHeaders(SlingHttpServletResponse response){
        response.setContentType(JSONResponse.RESPONSE_CONTENT_TYPE);
        response.setHeader("Cache-Control", "nocache");
        response.setCharacterEncoding("utf-8");
    }
}
