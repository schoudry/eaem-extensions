package apps.experienceaem.assets;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.fluent.Request;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.osgi.services.HttpClientBuilderFactory;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.*;

@Component(
        name = "Experience AEM Image Proxy Servlet",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=GET",
                "sling.servlet.paths=/bin/experience-aem/proxy"
        }
)
public class ProxyContentServlet extends SlingAllMethodsServlet{
    private static final Logger log = LoggerFactory.getLogger(ProxyContentServlet.class);

    private static String IMAGE = "IMAGE";
    private static String XML = "XML";

    @Reference
    private HttpClientBuilderFactory httpClientBuilderFactory;

    private CloseableHttpClient httpClient;

    protected void activate(ComponentContext ctx) {
        HttpClientBuilder builder = httpClientBuilderFactory.newBuilder();

        RequestConfig requestConfig = RequestConfig.custom().setConnectTimeout(30000)
                .setSocketTimeout(30000).build();

        builder.setDefaultRequestConfig(requestConfig);

        httpClient = builder.build();

    }
    @Override
    protected final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
                                ServletException, IOException {
        try {
            String url = request.getParameter("url");
            String fileName = request.getParameter("fileName");
            String format = request.getParameter("format");

            if(StringUtils.isEmpty(url)){
                throw new Exception("Empty url");
            }

            if(StringUtils.isEmpty(format)){
                format = IMAGE;
            }

            if(format.equalsIgnoreCase(IMAGE)){
                streamImage(response, url, fileName);
            }else if(format.equalsIgnoreCase(XML)){
                streamXML(response, url);
            }
        } catch (Exception e) {
            log.error("Could not getting binary response", e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void streamImage(SlingHttpServletResponse response, String url, String fileName) throws Exception{
        if(StringUtils.isEmpty(fileName)){
            fileName = "eaem.jpg";
        }

        response.setContentType("application/octet-stream");
        response.setHeader("Content-disposition","attachment; filename=" + fileName);

        writeContent(response, url);
    }

    private void streamXML(SlingHttpServletResponse response, String url) throws Exception{
        response.setContentType("application/xml");

        writeContent(response, url);
    }

    private void writeContent(SlingHttpServletResponse response, String url) throws Exception{
        byte[] image = Request.Get(url).execute().returnContent().asBytes();

        InputStream in = new ByteArrayInputStream(image);

        OutputStream out = response.getOutputStream();

        IOUtils.copy(in, out);

        out.close();

        in.close();
    }
}