package apps.experienceaem.references;

import com.day.cq.commons.TidyJSONWriter;
import com.day.cq.wcm.commons.ReferenceSearch;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;

import javax.servlet.ServletException;
import java.io.IOException;
import java.util.Collection;

@SlingServlet
@Properties({
        @Property(name = "sling.servlet.methods", value = {"GET"}, propertyPrivate = true),
        @Property(name = "sling.servlet.paths", value = "/bin/experience-aem/references", propertyPrivate = true),
        @Property(name = "sling.servlet.extensions", value = "json", propertyPrivate = true)})
public class GetReferences extends SlingAllMethodsServlet {
    @Override
    protected void doGet(SlingHttpServletRequest request,SlingHttpServletResponse response)
                        throws ServletException, IOException {
        String path = request.getParameter("path");

        if(StringUtils.isEmpty(path)){
            throw new ServletException("Empty path");
        }

        try{
            ResourceResolver resolver = request.getResourceResolver();
            TidyJSONWriter writer = new TidyJSONWriter(response.getWriter());

            ReferenceSearch referenceSearch = new ReferenceSearch();
            referenceSearch.setExact(true);
            referenceSearch.setHollow(true);
            referenceSearch.setMaxReferencesPerPage(-1);

            Collection<ReferenceSearch.Info> resultSet = referenceSearch.search(resolver, path).values();

            writer.array();

            for (ReferenceSearch.Info info: resultSet) {
                for (String p: info.getProperties()) {
                    writer.value(p);
                }
            }

            writer.endArray();
        }catch(Exception e){
            throw new ServletException("Error getting references", e);
        }
    }
}
