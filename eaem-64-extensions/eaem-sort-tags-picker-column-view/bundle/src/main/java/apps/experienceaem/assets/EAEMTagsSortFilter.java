package apps.experienceaem.assets;

import com.adobe.granite.ui.components.ds.AbstractDataSource;
import com.adobe.granite.ui.components.ds.DataSource;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;

import javax.servlet.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;

@Component( description = "Experience AEM Request filter for libs.cq.gui.components.coral.common.form.tagfield.datasources.children",
            label = "Experience AEM Tags Sort Filter")
@Service({Filter.class})
@Properties({
        @Property(name = "sling.filter.scope", value = {"REQUEST"}, propertyPrivate = true),
        @Property(  name = "sling.filter.pattern",
                value = {"/mnt/overlay/cq/gui/content/coral/common/form/tagfield/picker.*"},
                propertyPrivate = true),
        @Property(name = "service.ranking", intValue = {-99}, propertyPrivate = true)})
public class EAEMTagsSortFilter implements Filter {
    public static String DATA_SOURCE_NAME = DataSource.class.getName();

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        chain.doFilter(new TagSortSlingServletRequestWrapper((SlingHttpServletRequest)request), response);
    }

    @Override
    public void destroy() {
    }

    private class TagSortSlingServletRequestWrapper extends SlingHttpServletRequestWrapper {
        public TagSortSlingServletRequestWrapper(final SlingHttpServletRequest request) {
            super(request);
        }

        @Override
        public Object getAttribute(String attrName) {
            if(!EAEMTagsSortFilter.DATA_SOURCE_NAME.equals(attrName)){
                return super.getAttribute(attrName);
            }

            DataSource ds = (DataSource)super.getAttribute(attrName);

            if(ds == null){
                return ds;
            }

            final List<Resource> sortedList = new ArrayList<Resource>();
            Iterator<Resource> items = ds.iterator();

            while(items.hasNext()){
                sortedList.add(items.next());
            }

            //sortedList.sort(Comparator.comparing(Resource::getName));

            sortedList.sort(Comparator.comparing(Resource::getValueMap, (v1, v2) -> {
                return v1.get("jcr:title", "").compareTo(v2.get("jcr:title", ""));
            }));

            ds = new AbstractDataSource() {
                public Iterator<Resource> iterator() {
                    return sortedList.iterator();
                }
            };

            return ds;
        }
    }
}
