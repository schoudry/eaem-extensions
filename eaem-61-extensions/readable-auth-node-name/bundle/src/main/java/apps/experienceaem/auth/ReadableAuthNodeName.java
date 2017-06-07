package apps.experienceaem.auth;

import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Service;
import org.apache.jackrabbit.oak.spi.security.user.AuthorizableNodeName;

@Component
@Service(AuthorizableNodeName.class)
public class ReadableAuthNodeName implements AuthorizableNodeName {
    @Override
    public String generateNodeName(String authorizableId) {
        return (authorizableId.length() > 3 ? authorizableId.substring(0, 3) : authorizableId)
                    .replaceAll("[^A-Za-z0-9]", "-");
    }
}
