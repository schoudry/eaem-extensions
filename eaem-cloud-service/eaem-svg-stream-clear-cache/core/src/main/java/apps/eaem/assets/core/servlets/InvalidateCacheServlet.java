package apps.eaem.assets.core.servlets;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.distribution.*;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component(
        name = "Experience AEM Invalidate Cache Servlet",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=GET",
                "sling.servlet.paths=/bin/eaem/cache/invalidate"
        }
)
public class InvalidateCacheServlet extends SlingSafeMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(InvalidateCacheServlet.class);

    private static final String ICONS_FOLDER = "/content/dam/eaem-svg-stream-clear-cache";
    private static final String SPRITE_CACHE_PATH = "/bin/eaem/sprite.svg";
    private static final String PUBLISH_AGENT = "publish";

    @Reference
    private Distributor distributor;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        try{
            String path = request.getParameter("path");
            String type = request.getParameter("type");

            if(StringUtils.isEmpty(type)){
                type = "BOTH";
            }

            PrintWriter writer = response.getWriter();

            if(StringUtils.isEmpty(path)){
                writer.println("Empty path...");
                return;
            }

            ResourceResolver resolver = request.getResourceResolver();

            if("DISPATCHER".equals(type)){
                writer.println("---->DISPATCHER CLEAR CACHE VIA SERVLET : " + path + "\n");
                clearDispatcherCache(resolver, SPRITE_CACHE_PATH, writer);
            }else if("CDN".equals(type)){
                writer.println("---->CDN CLEAR CACHE VIA SERVLET : " + path + "\n");
                clearCDNCache(SPRITE_CACHE_PATH, writer);
            }else{
                LOGGER.info("---->DISPATCHER AND CDN CLEAR CACHE VIA SERVLET : " + path);
                clearDispatcherCache(resolver, SPRITE_CACHE_PATH, writer);
                clearCDNCache(SPRITE_CACHE_PATH, writer) ;
            }
        }catch(Exception e){
            throw new ServletException("Error", e);
        }
    }

    private void clearDispatcherCache(ResourceResolver resolver, String path, PrintWriter writer ){
        DistributionRequest distributionRequest = new SimpleDistributionRequest(DistributionRequestType.INVALIDATE, false, path);

        DistributionResponse dResponse = distributor.distribute(PUBLISH_AGENT, resolver, distributionRequest);

        if(!dResponse.isSuccessful()){
            writer.println("Error Dispatcher Clear : " + dResponse.getDistributionInfo().getId() + " - " + dResponse.getMessage());
        }else{
            writer.println("Success Dispatcher Cache cleared successfully for - " + path);
        }
    }

    private void clearCDNCache(String path, PrintWriter writer ) throws Exception{
        String CDN_PUBLISH_HOST = "https://publish-p10961-e854712.adobeaemcloud.com";
        String PURGE_KEY = "530d7d660d4fb5a43ba11187f3456f73819464c4bccf64d2505027e5df093d23";
        String METHOD_PURGE = "PURGE";

        HttpClient cdnClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        HttpRequest cdnRequest = HttpRequest.newBuilder()
                .uri(URI.create(CDN_PUBLISH_HOST + path))
                .header("x-aem-purge-key", PURGE_KEY)
                .method(METHOD_PURGE, HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> cdnResponse = cdnClient.send(cdnRequest, HttpResponse.BodyHandlers.ofString());

        if (cdnResponse.statusCode() != 200) {
            writer.println("Error clearing CDN Cache, response code : " + cdnResponse.statusCode() + ", " + cdnResponse.body());
        }else{
            writer.println("Success : " + cdnResponse.body());
        }
    }
}
