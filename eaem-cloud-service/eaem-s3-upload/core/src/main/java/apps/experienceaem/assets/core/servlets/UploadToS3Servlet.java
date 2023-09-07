package apps.experienceaem.assets.core.servlets;

import com.amazonaws.services.s3.AmazonS3;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
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

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {

        try{
            AmazonS3ClientBuilder s3ClientBuilder = AmazonS3ClientBuilder.standard();

            response.getWriter().println("-----" + s3ClientBuilder);

        }catch(Exception e){
            throw new ServletException("Error", e);
        }
    }
}
