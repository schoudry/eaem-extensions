package apps.experienceaem.sites.core.servlets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.service.component.annotations.Component;

import javax.servlet.ServletException;
import java.io.IOException;
import javax.servlet.Servlet;


@Component(
    service = Servlet.class,
    property = {
        "sling.servlet.paths=/bin/eaem/metadata/options",
        "sling.servlet.methods=GET"
    }
)
public class MetadataOptionsServlet extends SlingSafeMethodsServlet {
    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {
        response.setContentType("text/plain");
        String json = "{\n" +
                      "  \"options\":[\n" +
                      "    {\n" +
                      "      \"text\":\"Option One\",\n" +
                      "      \"value\":\"OPTION_ONE\"\n" +
                      "    },\n" +
                      "    {\n" +
                      "      \"text\":\"Option Two\",\n" +
                      "      \"value\":\"OPTION_TWO\"\n" +
                      "    },\n" +
                      "    {\n" +
                      "      \"text\":\"Option Three\",\n" +
                      "      \"value\":\"OPTION_THREE\"\n" +
                      "    }\n" +
                      "  ]\n" +
                      "}";
        response.getWriter().write(json);
    }
}
