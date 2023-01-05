package apps.eaem.assets.core.servlets;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.message.BasicHttpRequest;
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
    private static final String SPRITE_CACHE_PATH = "/content/api/eaem/sprite.svg";
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
                path = SPRITE_CACHE_PATH;
            }

            ResourceResolver resolver = request.getResourceResolver();

            if("DISPATCHER".equals(type)){
                writer.println("---->DISPATCHER CLEAR CACHE VIA SERVLET : " + path + "\n");
                clearDispatcherCache(resolver, path, writer);
            }else if("CDN".equals(type)){
                writer.println("---->CDN CLEAR CACHE VIA SERVLET : " + path + "\n");
                clearCDNCache(path, writer, request);
            }else{
                LOGGER.info("---->DISPATCHER AND CDN CLEAR CACHE VIA SERVLET : " + path);
                clearDispatcherCache(resolver, path, writer);
                clearCDNCache(path, writer, request) ;
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
            writer.println("Success Dispatcher Cache cleared successfully for - " + path + ", " + dResponse.getMessage());
        }
    }

    private void clearCDNCache(String path, PrintWriter writer, SlingHttpServletRequest request ) throws Exception{
        String CDN_PUBLISH_HOST = request.getParameter("cdnHost");
        String PURGE_KEY = request.getParameter("purgeKey");
        String METHOD_PURGE = "PURGE";

        HttpHost host = new HttpHost(CDN_PUBLISH_HOST);
        HttpClient httpclient = HttpClientBuilder.create().build();

        BasicHttpRequest purgeRequest = new BasicHttpRequest(METHOD_PURGE, path);
        purgeRequest.addHeader("x-aem-purge-key", PURGE_KEY);

        HttpResponse cdnResponse = httpclient.execute(host, purgeRequest);
        writer.println("Success : " + cdnResponse.getStatusLine());
    }
}
