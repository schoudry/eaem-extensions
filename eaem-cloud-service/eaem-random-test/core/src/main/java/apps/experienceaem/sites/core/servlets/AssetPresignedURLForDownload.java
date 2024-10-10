package apps.experienceaem.sites.core.servlets;

import com.adobe.xfa.ut.StringUtils;
import com.day.cq.dam.api.Asset;
import com.day.cq.search.PredicateGroup;
import com.day.cq.search.Query;
import com.day.cq.search.QueryBuilder;
import com.day.cq.search.result.Hit;
import com.day.cq.search.result.SearchResult;
import org.apache.jackrabbit.api.binary.BinaryDownload;
import org.apache.jackrabbit.api.binary.BinaryDownloadOptions;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Binary;
import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Component(
    immediate = true,
    service = Servlet.class,
    property = {
        Constants.SERVICE_DESCRIPTION + "=Experience AEM Presigned Download Urls",
        "sling.servlet.methods=" + HttpConstants.METHOD_GET,
        "sling.servlet.resourceTypes=sling/servlet/default",
        "sling.servlet.extensions=" + "eaemPresigned"
    }
)
public class AssetPresignedURLForDownload extends SlingSafeMethodsServlet {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Reference
    private QueryBuilder builder;

    @Override
    protected void doGet(final SlingHttpServletRequest req, final SlingHttpServletResponse resp) {
        try{
            String fileName = req.getRequestPathInfo().getResourcePath();

            if(StringUtils.isEmpty(fileName)){
                throw new ServletException("Empty file name");
            }

            fileName = fileName.substring(1, fileName.lastIndexOf("."));

            ResourceResolver resolver = req.getResourceResolver();

            Query query = builder.createQuery(PredicateGroup.create(getPredicateMap(fileName)), resolver.adaptTo(Session.class));

            SearchResult result = query.getResult();
            String resourcePath = null;

            for (Hit hit : result.getHits()) {
                resourcePath = hit.getPath();
            }

            if(resourcePath == null){
                throw new ServletException("Resource not found with name : " + fileName);
            }

            Asset asset = resolver.getResource(resourcePath).adaptTo(Asset.class);
            Binary binary = asset.getOriginal().getBinary();

            if (!(binary instanceof BinaryDownload)) {
                resp.getWriter().println("Asset not of type BinaryDownload, download uri not available");
                return;
            }

            BinaryDownload binaryDownload = (BinaryDownload) binary;
            BinaryDownloadOptions downloadOptions = BinaryDownloadOptions.builder()
                .withMediaType(asset.getMimeType())
                .withFileName(asset.getName())
                .withDispositionTypeAttachment()
                .build();

            URI uri = binaryDownload.getURI(downloadOptions);

            resp.setContentType("text/html");
            resp.getWriter().println("No Authentication Required to Download the Asset, link below : <BR> <BR>" + uri.toString());
        } catch (Exception e) {
            logger.error("Error generating presigned link : ", e);
        }
    }

    private static Map<String, String> getPredicateMap(String fileName) {
        Map<String, String> map = new HashMap<>();

        map.put("type", "dam:Asset");
        map.put("nodename", fileName);
        map.put("p.limit", "1");

        return map;
    }
}
