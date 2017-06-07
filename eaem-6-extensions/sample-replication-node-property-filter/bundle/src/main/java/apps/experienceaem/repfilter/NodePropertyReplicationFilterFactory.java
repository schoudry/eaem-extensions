package apps.experienceaem.repfilter;

import com.day.cq.replication.ReplicationAction;
import com.day.cq.replication.ReplicationActionType;
import com.day.cq.replication.ReplicationContentFilter;
import com.day.cq.replication.ReplicationContentFilterFactory;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Property;
import javax.jcr.RepositoryException;
import java.util.List;

@Component
@Service
public class NodePropertyReplicationFilterFactory implements ReplicationContentFilterFactory {

    private static final Logger log = LoggerFactory.getLogger(NodePropertyReplicationFilterFactory.class);

    private static final ReplicationContentFilter FILTER = new NodePropertyReplicationContentFilter();

    /**
     * Filter executes on content activation
     *
     * @param action The {@link ReplicationAction} to consider.
     *
     * @return
     */
    public ReplicationContentFilter createFilter(final ReplicationAction action) {
        return action.getType() == ReplicationActionType.ACTIVATE ? FILTER : null;
    }

    /**
     * Filters out some renditions and properties from activation
     */
    private static class NodePropertyReplicationContentFilter implements ReplicationContentFilter {
        private static String ALLOWED_RENDITION = "thumbnail.48.48.png";
        private static String RESTRICTED_PREFIX = "eaem:";

        /**
         * Filter any renditions other than thumbnail.48.48.png while Activation
         *
         * @param node The {@link Node} to check.
         * @return
         */
        public boolean accepts(final Node node) {
            try {
                String parentName = node.getParent().getName();

                if (!parentName.equals("renditions")) {
                    return true;
                }

                String nodeName = node.getName();

                return nodeName.endsWith(ALLOWED_RENDITION);
            } catch (RepositoryException e) {
                log.error("Error with filtering ", e);
            }

            return true;
        }

        /**
         * Any property with prefix eaem: is not activated
         *
         * @param property The {@link Property} to check.
         * @return
         */
        public boolean accepts(final Property property) {
            try {
                String name = property.getName();

                return !name.startsWith(RESTRICTED_PREFIX);
            } catch (RepositoryException e) {
                log.error("Error with filtering ", e);
            }

            return true;
        }

        public boolean allowsDescent(final Node node) {
            return true;
        }

        public List<String> getFilteredPaths() {
            return null;
        }
    }
}
