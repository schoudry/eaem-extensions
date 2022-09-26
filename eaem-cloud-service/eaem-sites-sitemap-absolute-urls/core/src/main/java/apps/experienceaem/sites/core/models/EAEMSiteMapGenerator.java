package apps.experienceaem.sites.core.models;

import java.util.Calendar;
import java.util.Optional;

import com.day.cq.replication.ReplicationStatus;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.sitemap.SitemapException;
import org.apache.sling.sitemap.builder.Sitemap;
import org.apache.sling.sitemap.builder.Url;
import org.apache.sling.sitemap.spi.generator.ResourceTreeSitemapGenerator;
import org.apache.sling.sitemap.spi.generator.SitemapGenerator;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

import com.day.cq.wcm.api.Page;

@Component(
        property = {"service.ranking:Integer=99"},
        service = {SitemapGenerator.class}
)
@Designate(ocd=EAEMSiteMapGenerator.Configuration.class)
public class EAEMSiteMapGenerator extends ResourceTreeSitemapGenerator {
    private String siteMapHostPrefix = "";

    @Activate
    protected void activate(EAEMSiteMapGenerator.Configuration configuration) {
        this.siteMapHostPrefix = configuration.siteMapHostPrefix();
    }

    @Override
    protected void addResource(final String name, final Sitemap sitemap, final Resource resource) throws SitemapException {
        final Page page = resource.adaptTo(Page.class);
        String location = resource.getResourceResolver().map(page.getPath());

        location = this.siteMapHostPrefix + location;

        final Url url = sitemap.addUrl(location);

        Calendar lastmod = getLastmodDate(page);
        if (lastmod != null) {
            url.setLastModified(lastmod.toInstant());
        }
    }

    private Calendar getLastmodDate(Page page) {
        Optional createdAt = Optional.ofNullable(page.getContentResource()).map((contentResource) -> {
            return (ReplicationStatus) contentResource.adaptTo(ReplicationStatus.class);
        }).map(ReplicationStatus::getLastPublished);

        if (createdAt.isPresent()) {
            return (Calendar) createdAt.get();
        }

        return null;
    }

    @ObjectClassDefinition(
            name = "Experience AEM - Page Tree Sitemap Generator Configuration"
    )
    @interface Configuration {
        @AttributeDefinition(
                name = "SiteMap Host Prefix",
                description = "SiteMap Host Prefix for making absolute urls in response of sitemap.xml requests",
                type = AttributeType.STRING
        )
        String siteMapHostPrefix() default "";
    }
}
