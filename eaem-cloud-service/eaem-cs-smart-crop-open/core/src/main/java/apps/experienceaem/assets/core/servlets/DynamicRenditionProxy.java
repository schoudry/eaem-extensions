package apps.experienceaem.assets.core.servlets;

import apps.experienceaem.assets.core.services.EAEMDMService;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.osgi.services.HttpClientBuilderFactory;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.mime.MimeTypeService;
import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component(
        name = "Experience AEM Dynamic Rendition Proxy Servlet",
        immediate = true,
        service = Servlet.class,
        property = { "sling.servlet.methods=GET", "sling.servlet.paths=/bin/eaem/proxy" })
public class DynamicRenditionProxy extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(DynamicRenditionProxy.class);

    @Reference
    private transient HttpClientBuilderFactory httpClientBuilderFactory;

    private transient CloseableHttpClient httpClient;

    @Reference
    private transient EAEMDMService dmcService;

    @Reference
    private transient ResourceResolverFactory factory;

    @Reference
    private transient MimeTypeService mimeTypeService;

    protected void activate(final ComponentContext ctx) {
        final HttpClientBuilder builder = httpClientBuilderFactory.newBuilder();

        final RequestConfig requestConfig = RequestConfig.custom().setConnectTimeout(30000).setSocketTimeout(30000)
                .build();

        builder.setDefaultRequestConfig(requestConfig);

        httpClient = builder.build();
    }

    @Override
    protected final void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        try {
            final String drUrl = request.getParameter("dr");

            if (StringUtils.isEmpty(drUrl)) {
                response.getWriter().print(getAEMIPAddress());
                return;
            }

            downloadImage(response, drUrl);
        } catch (final Exception e) {
            log.error("Could not get response", e);
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private String getAEMIPAddress() throws Exception {
        return Request.Get("https://ifconfig.me/ip").execute().returnContent().asString();
    }

    private void downloadImage(final SlingHttpServletResponse response, final String url) throws Exception {
        String fileName = url.substring(url.lastIndexOf("/") + 1);
        final String finalUrl = url.substring(0, url.lastIndexOf("/")) + "/"
                                + URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString());
        fileName = fileName.replaceAll(":", "-");

        log.info("Encoded URL: {}", finalUrl);

        final HttpGet get = new HttpGet(finalUrl);
        final CloseableHttpResponse s7Response = httpClient.execute(get);

        final String contentType = ContentType.get(s7Response.getEntity()).getMimeType();
        fileName = fileName + "." + mimeTypeService.getExtension(contentType);

        response.setContentType("application/octet-stream");
        response.setHeader("Content-disposition", "attachment; filename=" + fileName);

        final InputStream in = s7Response.getEntity().getContent();

        final OutputStream out = response.getOutputStream();

        IOUtils.copy(in, out);

        out.close();

        in.close();
    }

    private void streamImage(final SlingHttpServletResponse response, final String url) throws Exception {
        response.setContentType("image/jpeg");

        final byte[] image = Request.Get(url).execute().returnContent().asBytes();

        final InputStream in = new ByteArrayInputStream(image);

        final OutputStream out = response.getOutputStream();

        IOUtils.copy(in, out);

        out.close();

        in.close();
    }
}
