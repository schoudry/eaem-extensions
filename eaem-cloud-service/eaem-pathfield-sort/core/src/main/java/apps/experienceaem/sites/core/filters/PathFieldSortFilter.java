package apps.experienceaem.sites.core.filters;

import com.adobe.granite.ui.components.ds.AbstractDataSource;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Component;

import com.adobe.granite.ui.components.ds.DataSource;

import javax.servlet.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;

@Component(
        service = Filter.class,
        immediate = true,
        name = "Experience AEM PathField Sort Filter",
        property = {
                Constants.SERVICE_RANKING + ":Integer=-99",
                "sling.filter.scope=REQUEST",
                "sling.filter.pattern=/mnt/overlay/cq/gui/content/coral/common/form/pagefield/picker.*"
        }
)
public class PathFieldSortFilter implements Filter {
    public static String DATA_SOURCE_NAME = DataSource.class.getName();

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        chain.doFilter(new PathFieldSlingServletRequestWrapper((SlingHttpServletRequest) request), response);
    }

    @Override
    public void destroy() {
    }

    private class PathFieldSlingServletRequestWrapper extends SlingHttpServletRequestWrapper {
        public PathFieldSlingServletRequestWrapper(final SlingHttpServletRequest request) {
            super(request);
        }

        @Override
        public Object getAttribute(String attrName) {
            if (!PathFieldSortFilter.DATA_SOURCE_NAME.equals(attrName)) {
                return super.getAttribute(attrName);
            }

            DataSource ds = (DataSource) super.getAttribute(attrName);

            if (ds == null) {
                return ds;
            }

            final List<Resource> sortedList = new ArrayList<Resource>();
            Iterator<Resource> items = ds.iterator();

            while (items.hasNext()) {
                sortedList.add(items.next());
            }

            sortedList.sort(Comparator.comparing(Resource::getName));

            ds = new AbstractDataSource() {
                public Iterator<Resource> iterator() {
                    return sortedList.iterator();
                }
            };

            return ds;
        }
    }
}

