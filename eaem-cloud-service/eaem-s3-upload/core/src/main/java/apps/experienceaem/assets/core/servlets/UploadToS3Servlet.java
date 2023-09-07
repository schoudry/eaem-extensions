package apps.experienceaem.assets.core.servlets;

import apps.experienceaem.assets.core.services.S3Service;
import com.adobe.xfa.ut.StringUtils;
import com.amazonaws.services.s3.AmazonS3;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(
    name = "Experience AEM Upload to S3 Servlet",
    immediate = true,
    service = Servlet.class,
    property = {
        "sling.servlet.methods=GET",
        "sling.servlet.paths=/bin/eaem/s3/upload"
    }
)
public class UploadToS3Servlet extends SlingAllMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(UploadToS3Servlet.class);

    @Reference
    S3Service s3Service;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {

        try{
            String path = request.getParameter("path");

            if(StringUtils.isEmpty(path) || !path.endsWith(".csv")){
                response.getWriter().println("'path' parameter missing in request or not a csv");
                return;
            }

            Resource csvRes = request.getResourceResolver().getResource(path);

            if(csvRes == null){
                response.getWriter().println("No csv or no access to the csv : " + path);
                return;
            }

            s3Service.uploadToS3(csvRes);
        }catch(Exception e){
            throw new ServletException("Error", e);
        }
    }
}
