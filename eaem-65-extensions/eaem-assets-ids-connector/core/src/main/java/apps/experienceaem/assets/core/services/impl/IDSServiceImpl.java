package apps.experienceaem.assets.core.services.impl;

import apps.experienceaem.assets.core.listeners.IDSJobConsumer;
import apps.experienceaem.assets.core.services.IDSService;
import com.day.cq.dam.commons.xml.DocumentBuilderFactoryProvider;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.ArrayUtils;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.fluent.Request;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.osgi.services.HttpClientBuilderFactory;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
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
import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.jcr.Node;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.*;
import java.util.Arrays;
import java.util.Map;

@Component(service = IDSService.class)
@Designate(ocd = IDSServiceImpl.IDSConfiguration.class)
public class IDSServiceImpl implements IDSService{
    private final Logger logger = LoggerFactory.getLogger(IDSJobConsumer.class);

    private String[] idsScripts = new String[0];
    private String inDesignServerUrl = "";
    private String base64EncodedAEMCreds = "";
    private String aemHost = "";
    private String s3BucketName = "";
    private String s3AccessKey = "";
    private String s3SecretKey = "";
    private String s3Region = "";

    @Reference
    private transient HttpClientBuilderFactory httpClientBuilderFactory;

    private transient CloseableHttpClient httpClient;

    @Override
    public JsonObject executeInDesignServerRequest(ResourceResolver resolver, String payload) throws Exception{
        String response = Request.Post(inDesignServerUrl)
                .addHeader("HttpPost", "")
                .bodyString(payload, ContentType.APPLICATION_XML)
                .execute().returnContent().asString();

        logger.debug("InDesign Server Response : " + response);

        Document document = getResponseDocument(response);

        String resultJSON = document.getElementsByTagName("data").item(0).getFirstChild().getNodeValue();

        JsonObject resultObj = new JsonParser().parse(resultJSON).getAsJsonObject();

        return resultObj;
    }

    private Document getResponseDocument(String responseStr) throws Exception{
        DocumentBuilderFactoryProvider factoryprovider = new DocumentBuilderFactoryProvider();
        DocumentBuilderFactory factory = factoryprovider.createSecureBuilderFactory(false, false);

        DocumentBuilder builder = factory.newDocumentBuilder();
        builder.setErrorHandler(new ErrorHandler() {
            @Override
            public void warning(SAXParseException exception) throws SAXException {
                logger.debug("Error parsing SOAP response {}:", exception.getMessage());
            }
            @Override
            public void error(SAXParseException exception) throws SAXException {
                logger.debug("Error parsing SOAP response {}:", exception.getMessage());
            }

            @Override
            public void fatalError(SAXParseException exception) throws SAXException {
                logger.debug("Error parsing SOAP response {}:", exception.getMessage());
            }
        });

        return builder.parse(new InputSource(new StringReader(responseStr)));
    }

    @Override
    public String buildSOAPPayload(ResourceResolver resolver, Map<String, String> scriptArs,
                                   Resource indesignRes, String[] customScripts){
        StringBuilder payload = new StringBuilder();

        payload.append(getSOAPHeader());

        payload.append("<SOAP-ENV:Body><IDSP:RunScript><IDSP:runScriptParameters><IDSP:scriptText><![CDATA[");

        payload.append(getGiantScript(resolver, customScripts));

        payload.append("]]></IDSP:scriptText>");

        payload.append(getScriptInputArgs(scriptArs, indesignRes));

        payload.append("</IDSP:runScriptParameters></IDSP:RunScript></SOAP-ENV:Body>");

        payload.append(getSOAPFooter());

        return payload.toString();
    }

    private String getScriptInputArgs(Map<String, String> scriptArs, Resource indesignRes){
        scriptArs.put("aemHost", aemHost);
        scriptArs.put("base64EncodedAEMCreds", base64EncodedAEMCreds);

        StringBuilder args = new StringBuilder();
        args.append("<IDSP:scriptLanguage>javascript</IDSP:scriptLanguage>");

        scriptArs.entrySet().forEach(entry -> {
            args.append("<IDSP:scriptArgs>");
            args.append("<IDSP:name>").append(entry.getKey()).append("</IDSP:name>");
            args.append("<IDSP:value><![CDATA[").append(entry.getValue()).append("]]></IDSP:value>");
            args.append("</IDSP:scriptArgs>");
        });

        return args.toString();
    }

    private String getSOAPHeader(){
        return "<?xml version='1.0' encoding='UTF-8'?>" +
                    "<SOAP-ENV:Envelope xmlns:SOAP-ENV='http://schemas.xmlsoap.org/soap/envelope/' " +
                        "xmlns:xsd='http://www.w3.org/2001/XMLSchema' " +
                        "xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " +
                        "xmlns:SOAP-ENC='http://schemas.xmlsoap.org/soap/encoding/' " +
                        "xmlns:IDSP='http://ns.adobe.com/InDesign/soap/'>";
    }

    private String getSOAPFooter(){
        return "</SOAP-ENV:Envelope>";
    }

    private String getGiantScript(ResourceResolver resolver, String[] customScripts){
        StringBuilder script = new StringBuilder();

        if(ArrayUtils.isEmpty(customScripts)){
            customScripts = idsScripts;
        }

        Arrays.stream(customScripts).forEach( scriptPath -> {
            Resource resource = resolver.getResource(scriptPath);

            if(resource == null){
                throw new RuntimeException("Error finding script resource : " + scriptPath);
            }

            Node scriptNode = (Node)resource.adaptTo(Node.class);
            try {
                script.append(IOUtils.toString(scriptNode.getProperty("jcr:data").getBinary().getStream()));
            } catch (Exception e) {
                throw new RuntimeException("Error adding script resource : " + scriptPath);
            }
        });

        return script.toString();
    }

    @Activate
    @Modified
    protected void activate(final IDSConfiguration config) {
        idsScripts = config.inDesignServerScripts();

        inDesignServerUrl = config.inDesignServerUrl();
        aemHost = config.aemHost();
        base64EncodedAEMCreds = config.base64EncodedAEMCreds();

        final HttpClientBuilder builder = httpClientBuilderFactory.newBuilder();

        final RequestConfig requestConfig = RequestConfig.custom().setConnectTimeout(30000)
                .setSocketTimeout(30000).build();

        builder.setDefaultRequestConfig(requestConfig);

        httpClient = builder.build();
    }

    @ObjectClassDefinition(name = "Experience AEM InDesign Server Configuration")
    public @interface IDSConfiguration {

        @AttributeDefinition(
                name = "InDesign Scripts in order",
                description = "Add the InDesign Server Scripts in execution order",
                type = AttributeType.STRING,
                cardinality = 5
        )
        String[] inDesignServerScripts() default {
                "/libs/settings/dam/indesign/scripts/json2.jsx/jcr:content",
                "/libs/settings/dam/indesign/scripts/cq-lib.jsx/jcr:content",
                "/apps/eaem-assets-ids-connector/indesign/scripts/create-pdf.jsx/jcr:content"
        };

        @AttributeDefinition(
                name = "InDesign Server endpoint",
                description = "Add the InDesign Server endpoint url eg. http://localhost:8080",
                type = AttributeType.STRING
        )
        String inDesignServerUrl() default "http://localhost:8080";

        @AttributeDefinition(
                name = "AEM Server",
                description = "The AEM Server, InDesign Server should connect to and download the documents/images/fragments",
                type = AttributeType.STRING
        )
        String aemHost() default "localhost:4502";

        @AttributeDefinition(
                name = "Base64 encoded AEM Creds",
                description = "Base 64 encoded AEM Credentials Indesign server should use for download, eg. admin:admin is YWRtaW46YWRtaW4=",
                type = AttributeType.STRING
        )
        String base64EncodedAEMCreds() default "YWRtaW46YWRtaW4=";
    }
}
