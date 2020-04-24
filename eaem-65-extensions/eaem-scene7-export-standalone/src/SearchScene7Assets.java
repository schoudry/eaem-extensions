import com.scene7.ipsapi.AuthHeader;
import com.scene7.ipsapi.SearchAssetsParam;
import com.scene7.ipsapi.StringArray;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.ByteArrayRequestEntity;
import org.apache.commons.httpclient.methods.PostMethod;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

public class SearchScene7Assets {
    private static String S7_NA_IPS_URL = "https://s7sps1apissl.scene7.com/scene7/api/IpsApiService"; //available in AEM http://localhost:4502/libs/settings/dam/scene7/endpoints.html
    private static String S7_COMPANY_HANDLE = "c|230095"; // available via api or in AEM /conf/global/settings/cloudconfigs/dmscene7/jcr:content
    private static String S7_USER = "";
    private static String S7_PASS = "";
    private static String STAND_ALONE_APP_NAME = "Experiencing AEM";

    public static void main(String[] args) throws Exception {
        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        SearchAssetsParam searchAssetsParam = getSearchAssetsParam();

        marshaller = getMarshaller(searchAssetsParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(searchAssetsParam, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        Map<String, String> imageSets = parseResponse(responseBody);

        printImageSets(imageSets);
    }

    private static void printImageSets(Map<String, String> imageSets){
        if(imageSets.isEmpty()){
            System.out.println("No imagesets in account - " + S7_COMPANY_HANDLE);
            return;
        }

        System.out.println("Image Sets : ");

        for(Map.Entry entry : imageSets.entrySet()){
            System.out.println("    " + entry.getKey() + " - " + entry.getValue());
        }
    }

    private static Map<String, String> parseResponse(byte[] responseBody) throws Exception{
        Map<String, String> imageSets = new HashMap<String, String>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/searchAssetsReturn/assetArray/items";

        NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() == Node.ELEMENT_NODE) {
                Element eElement = (Element) item;

                String handle = eElement.getElementsByTagName("assetHandle").item(0).getTextContent();
                String name = eElement.getElementsByTagName("name").item(0).getTextContent();

                imageSets.put(handle, name);
            }
        }

        return imageSets;
    }

    private static byte[] getResponse(String authHeaderStr, String apiMethod) throws Exception{
        StringBuilder requestBody = new StringBuilder("<Request xmlns=\"http://www.scene7.com/IpsApi/xsd/2017-10-29-beta\">");
        requestBody.append(authHeaderStr).append(apiMethod).append("</Request>");

        byte[] responseBody = null;
        PostMethod postMethod = null;

        try {
            HttpClient httpclient = new HttpClient();

            postMethod = new PostMethod(S7_NA_IPS_URL);

            postMethod.setRequestHeader("Content-Type", "text/xml");
            postMethod.setRequestEntity(new ByteArrayRequestEntity(requestBody.toString().getBytes()));

            int responseCode = httpclient.executeMethod(postMethod);

            if(responseCode != 200){
                System.out.println("Response code - " + responseCode + ", returning here...");
            }

            responseBody = postMethod.getResponseBody();
        }finally{
            if(postMethod != null){
                postMethod.releaseConnection();
            }
        }

        return responseBody;
    }

    private static AuthHeader getS7AuthHeader(){
        AuthHeader authHeader = new AuthHeader();

        authHeader.setUser(S7_USER);
        authHeader.setPassword(S7_PASS);
        authHeader.setAppName(STAND_ALONE_APP_NAME);
        authHeader.setAppVersion("1.0");
        authHeader.setFaultHttpStatusCode(new Integer(200));

        return authHeader;
    }

    private static SearchAssetsParam getSearchAssetsParam(){
        SearchAssetsParam searchAssetsParam = new SearchAssetsParam();
        StringArray assetTypes = new StringArray();
        assetTypes.getItems().add("ImageSet");

        searchAssetsParam.setCompanyHandle(S7_COMPANY_HANDLE);
        searchAssetsParam.setIncludeSubfolders(true);
        searchAssetsParam.setAssetTypeArray(assetTypes);

        return searchAssetsParam;
    }

    private static Marshaller getMarshaller(Class apiMethodClass) throws JAXBException {
        Marshaller marshaller = JAXBContext.newInstance(new Class[]{apiMethodClass}).createMarshaller();
        marshaller.setProperty("jaxb.formatted.output", Boolean.valueOf(true));
        marshaller.setProperty("jaxb.fragment", Boolean.valueOf(true));
        return marshaller;
    }
}
