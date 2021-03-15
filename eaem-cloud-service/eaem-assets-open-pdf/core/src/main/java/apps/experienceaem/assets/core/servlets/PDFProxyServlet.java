package apps.experienceaem.assets.core.servlets;

import com.day.cq.dam.api.Asset;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

@Component(
        name = "Experience AEM Proxy Servlet",
        immediate = true,
        service = Servlet.class,
        property = { "sling.servlet.methods=GET", "sling.servlet.paths=/bin/eaem/proxy" })
public class PDFProxyServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(PDFProxyServlet.class);

    @Override
    protected final void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        try {
            final String pdfPath = request.getParameter("path");

            if (StringUtils.isEmpty(pdfPath)) {
                return;
            }

            Resource pdfRes = request.getResourceResolver().getResource(pdfPath);

            streamPDF(response, pdfRes);
        } catch (final Exception e) {
            log.error("Could not get response", e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void streamPDF(final SlingHttpServletResponse response, final Resource pdfRes) throws Exception {
        String fileName = pdfRes.getPath().substring(pdfRes.getPath().lastIndexOf("/") + 1);

        response.setContentType("application/pdf");
        response.setHeader("Content-disposition", "inline; filename=" + fileName);

        Asset asset = pdfRes.adaptTo(Asset.class);
        final InputStream in = asset.getOriginal().getStream();

        final OutputStream out = response.getOutputStream();

        IOUtils.copy(in, out);

        out.close();

        in.close();
    }
}
