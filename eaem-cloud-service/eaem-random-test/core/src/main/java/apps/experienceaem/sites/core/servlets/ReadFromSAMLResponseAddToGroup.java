package apps.experienceaem.sites.core.servlets;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.Group;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
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
import javax.jcr.security.*;
import javax.servlet.Servlet;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.apache.jackrabbit.commons.jackrabbit.authorization.AccessControlUtils;

@Component(
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=GET",
                "sling.servlet.paths=/bin/experience-aem/read/saml/response"
        }
)
public class ReadFromSAMLResponseAddToGroup extends SlingSafeMethodsServlet {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private static final String AEM_ENVIRONMENT_TIER_PREVIEW = "preview";

    private static final String PREVIEW_GROUPS_PREFIX = "github-";

    @Reference
    ResourceResolverFactory resourceResolverFactory;

    String restrictedSAMLGroup = "github-copilot-users";

    JsonObject restrictedPreviewGroupsJson = new JsonObject();

    private String aemEnvTier;

    @Activate
    protected void activate(final ReadFromSAMLResponseAddToGroup.ReadFromSAMLResponseAddToGroupConfig config) {
        logger.info("[activate] - Activating ReadFromSAMLResponseAddToGroupConfig");

        try{
            restrictedPreviewGroupsJson = parseJsonString(config.getRestrictedPreviewGroupsJson());
            aemEnvTier = config.getAEMEnvTier();
        }catch (Exception e){
            logger.error("Error reading configuration", e);
        }
    }

    @Override
    protected void doGet(final SlingHttpServletRequest req, final SlingHttpServletResponse resp) {
        try{
            if(!AEM_ENVIRONMENT_TIER_PREVIEW.equals(aemEnvTier)){
                logger.info("CustomAuthenticationInfoPostProcessor - disabled as the environment tier set is {}",  aemEnvTier);
                return;
            }

            ResourceResolver serviceResolver= getUserManagementServiceResolver();
            UserManager um = serviceResolver.adaptTo(UserManager.class);

            Authorizable userAuthorizable = um.getAuthorizable(req.getUserPrincipal().getName());

            String samlResponseBase64 = "";

            InputStream inputStream = new ByteArrayInputStream(Base64.getDecoder().decode(samlResponseBase64));

            String result = IOUtils.toString(inputStream, StandardCharsets.UTF_8);

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            Document doc = builder.parse(new ByteArrayInputStream(result.getBytes()));

            XPath xPath =  XPathFactory.newInstance().newXPath();

            String expression = "//*[local-name()='Attribute'][@Name='memberOf']/AttributeValue";

            NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);

            List<String> smalGroupsAdded = new ArrayList<String>();

            for (int i = 0; i < itemList.getLength(); i++) {
                Node item = itemList.item(i);

                if(item.getNodeType() == Node.ELEMENT_NODE) {
                    Element eElement = (Element) item;
                    String samlGroup = eElement.getTextContent();

                    if(samlGroup.trim().startsWith("CN=" + restrictedSAMLGroup)){
                        addUserToGroup(serviceResolver, restrictedSAMLGroup, userAuthorizable);
                        smalGroupsAdded.add(restrictedSAMLGroup);
                    }
                }
            }

            removeUserFromOtherPreviewGroups(smalGroupsAdded, userAuthorizable);

            if (serviceResolver.hasChanges()) {
                serviceResolver.commit();
            }

        } catch (Exception e) {
            logger.error("Error reading saml response : ", e);
        }
    }

    private void setPermissionsOnPaths(String[] paths, Session serviceSession, Group group) throws Exception{
        boolean isAllow = true;

        for(String path : paths){
            if(serviceSession.itemExists(path)){
                logger.info("Setting allow permission for group {}, on path {}", group.getID(), path);
                AccessControlUtils.addAccessControlEntry(serviceSession, path, group.getPrincipal(), new String[]{ Privilege.JCR_READ }, isAllow);
            }else{
                logger.info("Cannot set allow permission for group {}, on path {} as the path does not exist", group.getID(), path);
            }
        }
    }

    private void removeUserFromOtherPreviewGroups(List<String> samlGroupsUserPartOf, Authorizable userAuthorizable) throws Exception{
        for (Iterator<Group> memOfGroups = userAuthorizable.declaredMemberOf(); memOfGroups.hasNext();) {
            Group mGroup = memOfGroups.next();
            String groupName = mGroup.getID();

            if(groupName.startsWith(PREVIEW_GROUPS_PREFIX) && !samlGroupsUserPartOf.contains(groupName)){
                mGroup.removeMember(userAuthorizable);
                logger.info("Removed user {} from group {}", userAuthorizable.getPath(), groupName);
            }
        }
    }

    private Group addUserToGroup(ResourceResolver serviceResolver, String groupName, Authorizable userAuthorizable) throws Exception{
        UserManager um = serviceResolver.adaptTo(UserManager.class);

        Authorizable authorizable = um.getAuthorizable(groupName);
        Group group = null;

        if (authorizable == null || !authorizable.isGroup()) {
            logger.info("No AEM group found {}, creating it", groupName);
            group = um.createGroup(groupName);
        }else{
            group = (Group) authorizable;
        }

        if(restrictedPreviewGroupsJson.has(groupName)){
            Session serviceSession = serviceResolver.adaptTo(Session.class);
            JsonElement rootPathsForGroup = restrictedPreviewGroupsJson.get(groupName);
            String[] paths = null;

            if(rootPathsForGroup.isJsonArray()){
                paths = new Gson().fromJson(rootPathsForGroup, String[].class);
            }else{
                paths = new String[] { rootPathsForGroup.getAsString() };
            }

            setPermissionsOnPaths(paths, serviceSession, group);
        }

        group.addMember(userAuthorizable);

        logger.info("Added user {} to group {}", userAuthorizable.getPath(), groupName);

        return group;
    }

    private ResourceResolver getUserManagementServiceResolver() throws Exception{
        Map<String, Object> USER_SERVICE_MAP = new HashMap<>();
        USER_SERVICE_MAP.put(ResourceResolverFactory.SUBSERVICE, "eaem-user-service");

        return resourceResolverFactory.getServiceResourceResolver(USER_SERVICE_MAP);
    }

    public static JsonObject parseJsonString(String jsonString) {
        return StringUtils.isNotBlank(jsonString) && new Gson().fromJson(jsonString, JsonObject.class).isJsonObject()
                ? new Gson().fromJson(jsonString, JsonObject.class).getAsJsonObject()
                : new JsonObject();
    }

    @ObjectClassDefinition(name = "ReadFromSAMLResponseAddToGroup Configuration",
            description = "ReadFromSAMLResponseAddToGroup Configuration")
    public @interface ReadFromSAMLResponseAddToGroupConfig {
        @AttributeDefinition(name = "Search Environment Variable",
                description = "Provide the Vault Private Key to fetch variable from environment configuration",
                type = AttributeType.STRING)
        String getRestrictedPreviewGroupsJson();

        @AttributeDefinition(name = "AEM Environment Tier",
                description = "AEM Environment Tier eg. preview",
                type = AttributeType.STRING)
        String getAEMEnvTier();
    }
}
