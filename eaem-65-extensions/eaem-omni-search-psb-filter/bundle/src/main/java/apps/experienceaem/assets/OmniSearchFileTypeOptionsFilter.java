package apps.experienceaem.assets;

import com.adobe.granite.ui.components.ds.AbstractDataSource;
import com.adobe.granite.ui.components.ds.DataSource;
import com.day.cq.commons.jcr.JcrUtil;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Component;
import org.osgi.framework.Constants;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import javax.servlet.*;
import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM - Omnisearch file type options filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.resourceTypes=dam/gui/coral/components/admin/customsearch/omnisearchpredicates/filetypepredicate/nestedcheckboxlist"
        }
)
public class OmniSearchFileTypeOptionsFilter implements Filter {
    private static Logger log = LoggerFactory.getLogger(OmniSearchFileTypeOptionsFilter.class);

    private static final String BITMAP_ROOT = "/libs/dam/content/predicates/omnisearch/mimetypes/items/images/sublist/items/bitmap/sublist";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;

        String resourcePath = slingRequest.getResource().getPath();

        if(!BITMAP_ROOT.equals(resourcePath)){
            chain.doFilter(slingRequest, response);
            return;
        }

        createTransientPSBFilterNode(slingRequest.getResourceResolver());

        chain.doFilter(slingRequest, response);
    }

    private void createTransientPSBFilterNode(ResourceResolver resolver){
        Node psbItem = null;

        try{
            Resource bitMapItemsResource = resolver.getResource(BITMAP_ROOT).getChild("items");
            Resource psResource = resolver.getResource(bitMapItemsResource.getPath() + "/photoshop");
            Session session = resolver.adaptTo(Session.class);

            psbItem = JcrUtil.createPath(bitMapItemsResource.getPath() + "/psb", "nt:unstructured", "nt:unstructured", session, false);

            psbItem.setProperty("text", "Adobe Photoshop PSB");
            psbItem.setProperty("value", "application/vnd.3gpp.pic-bw-small");

            bitMapItemsResource.adaptTo(Node.class).orderBefore(psbItem.getName(), psResource.getName());
        }catch(Exception e){
            log.error("Error creating transient PSB filter node", e);
        }
    }

    @Override
    public void destroy() {
    }
}