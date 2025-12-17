package apps.experienceaem.sites.core.servlets;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.api.JackrabbitSession;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.Group;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.auth.core.spi.AuthenticationInfo;
import org.apache.sling.auth.core.spi.AuthenticationInfoPostProcessor;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.jcr.Session;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@Component(service = AuthenticationInfoPostProcessor.class, immediate = true)
public class CustomAuthenticationInfoPostProcessor implements AuthenticationInfoPostProcessor {
    private static final Logger LOG = LoggerFactory.getLogger(CustomAuthenticationInfoPostProcessor.class);

    private boolean enabled;

    @Reference
    ResourceResolverFactory resourceResolverFactory;

    String restrictedSAMLGroup = "github-copilot-users";

    @Activate
    @Modified
    protected void activate(final CustomAuthenticationPostProcessorConfig config) {
        LOG.info("[activate] - Activating CustomAuthenticationInfoPostProcessor");
        enabled = config.is_enabled();
    }

    @Override
    public void postProcess(final AuthenticationInfo authenticationInfo,
                            final HttpServletRequest httpServletRequest,
                            final HttpServletResponse httpServletResponse) throws LoginException {

        String result = "";

        try{
            String base64SamlResponse = httpServletRequest.getParameter("SAMLResponse");

            if(StringUtils.isAllBlank(base64SamlResponse)){
                return;
            }

            ResourceResolver serviceResolver= getUserManagementServiceResolver();
            UserManager um = serviceResolver.adaptTo(UserManager.class);

            Authorizable userAuthorizable = um.getAuthorizable(httpServletRequest.getUserPrincipal().getName());

            InputStream inputStream = new ByteArrayInputStream(Base64.getDecoder().decode(base64SamlResponse));

            result = IOUtils.toString(inputStream, StandardCharsets.UTF_8);

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            Document doc = builder.parse(new ByteArrayInputStream(result.getBytes()));

            XPath xPath =  XPathFactory.newInstance().newXPath();

            String expression = "//*[local-name()='Attribute'][@Name='memberOf']/AttributeValue";

            NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);

            boolean groupExistsInIDP = false;

            for (int i = 0; i < itemList.getLength(); i++) {
                Node item = itemList.item(i);

                if(item.getNodeType() == Node.ELEMENT_NODE) {
                    Element eElement = (Element) item;
                    String samlGroup = eElement.getTextContent();

                    if(samlGroup.trim().startsWith("CN=" + restrictedSAMLGroup)){
                        addUserToGroup(um, restrictedSAMLGroup, userAuthorizable);
                        groupExistsInIDP = true;
                    }
                }
            }

            if(!groupExistsInIDP){
                removeUserFromGroup(um, restrictedSAMLGroup, userAuthorizable);
            }

            if (serviceResolver.hasChanges()) {
                serviceResolver.commit();
            }
        }catch (Exception e){
            LOG.error("Error reading saml response", e);
        }

        LOG.info("CustomAuthenticationInfoPostProcessor - SAMLResponse : " + result);
    }

    private void addUserToGroup(Session serviceSession, String groupName, String userName) throws Exception{
        UserManager um = ((JackrabbitSession) serviceSession).getUserManager();

        Authorizable authorizable = um.getAuthorizable(groupName);

        if (authorizable != null && authorizable.isGroup()) {
            Group group = (Group) authorizable;
            group.addMember(um.getAuthorizable(userName));
        }
    }

    private void removeUserFromGroup(UserManager um, String groupName, Authorizable userAuthorizable) throws Exception{
        for (Iterator<Group> memOfGroups = userAuthorizable.declaredMemberOf(); memOfGroups.hasNext();) {
            Group mGroup = memOfGroups.next();

            if(mGroup.getID().equals(groupName)){
                mGroup.removeMember(userAuthorizable);
                LOG.info("Removed user {} from group {}", userAuthorizable.getPath(), groupName);
            }
        }
    }

    private void addUserToGroup(UserManager um, String groupName, Authorizable userAuthorizable) throws Exception{
        Authorizable authorizable = um.getAuthorizable(groupName);

        if (authorizable == null || !authorizable.isGroup()) {
            LOG.info("No AEM group found {}", groupName);
            return;
        }

        Group group = (Group) authorizable;
        group.addMember(userAuthorizable);

        LOG.info("Added user {} to group {}", userAuthorizable.getPath(), groupName);
    }

    private ResourceResolver getUserManagementServiceResolver() throws Exception{
        Map<String, Object> USER_SERVICE_MAP = new HashMap<>();
        USER_SERVICE_MAP.put(ResourceResolverFactory.SUBSERVICE, "eaem-user-service");

        return resourceResolverFactory.getServiceResourceResolver(USER_SERVICE_MAP);
    }

    @ObjectClassDefinition(name = "Custom Authentication Post Processor Configuration",
            description = "Configuration details for the Custom Authentication Post Processor Service")
    public @interface CustomAuthenticationPostProcessorConfig {
        @AttributeDefinition(name = "Enabled",
                description = "Indicates if the processor should be enabled",
                type = AttributeType.BOOLEAN)
        boolean is_enabled() default true;
    }
}
