package apps.eaem.assets.core.servlets;

import com.day.cq.commons.jcr.JcrUtil;
import com.day.cq.contentsync.handler.util.RequestResponseFactory;
import com.google.gson.JsonObject;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.engine.SlingRequestProcessor;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.servlet.Servlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component(
        service = Servlet.class,
        property = {
                "sling.servlet.methods=" + HttpConstants.METHOD_POST,
                "sling.servlet.resourceTypes=" + "/bin/eaem/replace-binary"})
public class ReplaceBinaryServlet extends SlingAllMethodsServlet {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private static final String PROCESS_ASSET_SERVLET = "/bin/asynccommand";
    private static final String PROCESS_ASSET_OPERATION = "PROCESS";
    private static final String PROCESS_ASSET_PROFILE = "full-process";

    @Reference
    private SlingRequestProcessor slingRequestProcessor;

    @Reference
    private RequestResponseFactory requestResponseFactory;

    @Override
    protected void doPost(final SlingHttpServletRequest req, final SlingHttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        JsonObject responseObject = new JsonObject();

        String src = req.getParameter("srcAsset");
        String dest = req.getParameter("destAsset");

        try{
            if(StringUtils.isEmpty(src) || StringUtils.isEmpty(dest)){
                responseObject.addProperty("error", "Required parameters missing...");
            }else{
                replaceOriginalRendition(req.getResourceResolver(), src, dest);
                responseObject.addProperty("status", "success");
            }
        }catch (Exception e){
            logger.error("Error replacing binary for {}", src, e);
            responseObject.addProperty("error", "Error replacing binary : " + e.getMessage() );
        }

        resp.getWriter().write(responseObject.toString());
    }

    public boolean replaceOriginalRendition(ResourceResolver resolver, String sourceAssetPath, String destAssetPath) {
        Resource sourceAssetOrig = resolver.getResource(sourceAssetPath + "/jcr:content/renditions/original");
        Resource destAssetParent = resolver.getResource(destAssetPath + "/jcr:content/renditions");
        boolean replaceSuccess = false;

        try {
            destAssetParent.getChild("original").adaptTo(Node.class).remove();

            JcrUtil.copy(sourceAssetOrig.adaptTo(Node.class), destAssetParent.adaptTo(Node.class), null);

            resolver.commit();

            runAssetReProcess(resolver, destAssetPath);

            replaceSuccess = true;
        }catch (RepositoryException | PersistenceException e){
            logger.error("Error replacing original rendition for {}", sourceAssetPath, e);
            replaceSuccess = false;
        }

        return replaceSuccess;
    }

    public boolean runAssetReProcess(ResourceResolver resolver, String assetPath){
        boolean reprocessSuccess = true;
        logger.debug("Starting Reprocess of Asset {}", assetPath);

        Map<String, Object> requestParams = new HashMap<String, Object>();
        requestParams.put("operation", PROCESS_ASSET_OPERATION);
        requestParams.put("profile-select", PROCESS_ASSET_PROFILE);
        requestParams.put("runPostProcess", "false");
        requestParams.put("description", "Reprocessing asset - " + assetPath);
        requestParams.put("asset", assetPath);

        HttpServletRequest request = requestResponseFactory.createRequest("POST", PROCESS_ASSET_SERVLET, requestParams);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        HttpServletResponse response = this.requestResponseFactory.createResponse(bos);

        try {
            slingRequestProcessor.processRequest(request, response, resolver);
        }catch (Exception e){
            logger.error("Error while reprocessing {} ", assetPath, e);
            reprocessSuccess = false;
        }

        return reprocessSuccess;
    }
}
