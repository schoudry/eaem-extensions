package apps.experienceaem.assets.core.services.impl;

import apps.experienceaem.assets.core.services.EAEMDMService;
import com.day.cq.dam.scene7.api.*;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.xpath.*;
import java.util.HashMap;
import java.util.Map;


@Component(service = EAEMDMService.class)
@Designate(ocd = EAEMDMServiceImpl.DMServiceConfiguration .class)
public class EAEMDMServiceImpl implements EAEMDMService {
    private static final Logger log = LoggerFactory.getLogger(EAEMDMServiceImpl.class);

    private static String APPLICATION_TEST_SERVER_CONTEXT = "application_test_server_context";

    private static final String EAEM_SERVICE_USER = "eaem-service-user";

    private String dmcTestContext;

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    @Reference
    private Scene7Service scene7Service;

    @Reference
    private S7ConfigResolver s7ConfigResolver;

    @Reference
    private Scene7APIClient scene7APIClient;

    @Activate
    @Modified
    protected void activate(final DMServiceConfiguration  config) {
        dmcTestContext = config.dmc_test_context();

        if (StringUtils.isNotEmpty(dmcTestContext)) {
            dmcTestContext = dmcTestContext.trim();

            if (!dmcTestContext.endsWith("/")) {
                dmcTestContext = dmcTestContext + "/";
            }
        }

        log.debug("DMC(S7) test context set in configuration - " + dmcTestContext);
    }

    @Override
    public String getS7TestContext(final String assetPath) {
        if (StringUtils.isNotEmpty(dmcTestContext)) {
            log.info("DMC(S7) test context - " + dmcTestContext);
            return dmcTestContext;
        }

        String testContext = "";

        try {
            final ResourceResolver s7ConfigResourceResolver = getServiceResourceResolver();

            if (s7ConfigResourceResolver  == null) {
                return testContext;
            }

            S7Config s7Config = s7ConfigResolver.getS7ConfigForAssetPath(s7ConfigResourceResolver, assetPath);

            if (s7Config == null) {
                s7Config = s7ConfigResolver.getDefaultS7Config(s7ConfigResourceResolver);
            }

            final String appSettingsTypeHandle = scene7Service.getApplicationPropertyHandle(s7Config);
            final Document document = scene7APIClient.getPropertySets(appSettingsTypeHandle, s7Config);

            testContext = getPropertyValue(document, APPLICATION_TEST_SERVER_CONTEXT);

            if(StringUtils.isEmpty(testContext)){
                testContext = "https://preview1.assetsadobe.com/";
            }

            if (!testContext.endsWith("/")) {
                testContext = testContext + "/";
            }

            log.info("DMC(S7) test context read using api - " + testContext);

            dmcTestContext = testContext;
        } catch (final XPathExpressionException e) {
            log.error("Error getting S7 test context ", e);
        }

        return testContext;
    }

    public String getS7TestContextUrl(final String assetPath, final String deliveryUrl) {
        String testContextUrl = "";

        if (StringUtils.isEmpty(deliveryUrl)) {
            return testContextUrl;
        }

        String imageServerPath = "";

        imageServerPath = deliveryUrl.substring(deliveryUrl.indexOf("/is/image") + 1);

        testContextUrl = getS7TestContext(assetPath) + imageServerPath;

        testContextUrl = testContextUrl.replace("http://", "https://");

        log.debug("Rendition test context url - " + testContextUrl);

        return testContextUrl;
    }

    private String getPropertyValue(final Document document, final String name) throws XPathExpressionException {
        final XPath xpath = XPathFactory.newInstance().newXPath();
        String value = "";

        final String expression = getLocalName("getPropertySetsReturn") + getLocalName("setArray")
                + getLocalName("items") + getLocalName("propertyArray") + getLocalName("items");

        final XPathExpression xpathExpr = xpath.compile(expression);

        final NodeList nodeList = (NodeList) xpathExpr.evaluate(document, XPathConstants.NODESET);
        Node nameNode, valueNode;

        for (int i = 0; i < nodeList.getLength(); i++) {
            nameNode = nodeList.item(i).getFirstChild();

            if (!nameNode.getTextContent().equals(name)) {
                continue;
            }

            valueNode = nodeList.item(i).getLastChild();

            value = valueNode.getTextContent();

            break;
        }

        return value;
    }

    private String getLocalName(final String name) {
        return "/*[local-name()='" + name + "']";
    }

    public ResourceResolver getServiceResourceResolver() {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, EAEM_SERVICE_USER);
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (Exception ex) {
            log.error("Could not login as SubService user {}, exiting SearchService service.", "eaem-service-user", ex);
            return null;
        }
    }

    @ObjectClassDefinition(name = "Experience AEM Dynamic Media Configuration")
    public @interface DMServiceConfiguration {

        @AttributeDefinition(
                name = "DMC (S7) test context",
                description = "Set DMC (S7) test context (and not read it using API)",
                type = AttributeType.STRING)
        String dmc_test_context();
    }
}
