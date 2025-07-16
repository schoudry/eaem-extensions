package apps.experienceaem.sites.core.servlets;

import org.apache.commons.io.IOUtils;
import org.apache.jackrabbit.api.JackrabbitSession;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.Group;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;

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

    @Override
    protected void doGet(final SlingHttpServletRequest req, final SlingHttpServletResponse resp) {
        try{
            String samlResponseBase64 = "";

            InputStream inputStream = new ByteArrayInputStream(Base64.getDecoder().decode(samlResponseBase64));

            String result = IOUtils.toString(inputStream, StandardCharsets.UTF_8);

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            Document doc = builder.parse(new ByteArrayInputStream(result.getBytes()));

            XPath xPath =  XPathFactory.newInstance().newXPath();

            String expression = "//*[local-name()='Attribute'][@Name='memberOf']/AttributeValue";

            NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);

            for (int i = 0; i < itemList.getLength(); i++) {
                Node item = itemList.item(i);

                if(item.getNodeType() == Node.ELEMENT_NODE) {
                    Element eElement = (Element) item;
                    String samlGroup = eElement.getTextContent();

                    resp.getWriter().write(samlGroup + "\r\n");
                }
            }

        } catch (Exception e) {
            logger.error("Error reading saml response : ", e);
        }
    }

    private void addUserToGroup(Session serviceSession, String groupName, String userName) throws Exception{
        UserManager um = ((JackrabbitSession) serviceSession).getUserManager();

        Authorizable authorizable = um.getAuthorizable(groupName);

        if (authorizable != null && authorizable.isGroup()) {
            Group group = (Group) authorizable;
            group.addMember(um.getAuthorizable(userName));
        }
    }
}
