package apps.experienceaem.assets.core.filters;

import com.day.cq.commons.Externalizer;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.commons.json.JSONObject;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import java.io.IOException;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM - Change offer JSON exported to Target",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=COMPONENT",
                "sling.filter.pattern=(/content/experience-fragments/.*.model.json)",
        }
)
public class ExperienceFragmentJSONOfferFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(ExperienceFragmentJSONOfferFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        SlingHttpServletRequest slingRequest = (SlingHttpServletRequest) request;

        try {
            String uri = slingRequest.getRequestURI();

            if(!uri.endsWith(".model.json")){
                chain.doFilter(request, response);
                return;
            }

            JSONObject model = new JSONObject();

            String masterXFPath = uri.substring(0,uri.lastIndexOf(".model.json"));

            masterXFPath = masterXFPath + ".html";

            ResourceResolver resolver = slingRequest.getResourceResolver();
            Externalizer externalizer = resolver.adaptTo(Externalizer.class);

            model.put("xfHtmlPath", externalizer.publishLink(resolver, masterXFPath));

            response.getWriter().print(model);
        } catch (Exception e) {
            log.error("Error getting json offer response : " + slingRequest.getRequestURI());
        }
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void destroy() {
    }
}
