package apps;

import com.scene7.ipsapi.*;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.ByteArrayRequestEntity;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.io.IOUtils;
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
import java.io.*;
import java.net.URL;
import java.util.*;

public class UpdateSmartCrops {
    private static String S7_NA_IPS_URL = "https://s7sps1apissl.scene7.com/scene7/api/IpsApiService";
    private static String DEST_S7_COMPANY_HANDLE = "";
    private static String DEST_S7_USER = "";
    private static String DEST_S7_PASS = "";
    private static String STAND_ALONE_APP_NAME = "Experiencing AEM";
    private static String inputLogName = "all-smart-crops.csv";
    private static String successLogName = "updated-smart-crops.csv";
    private static String failedLogName = "failed-update-smart-crops.csv";
    private static BufferedReader INPUT_READER = null;
    private static BufferedWriter SUCCESS_WRITER = null;
    private static BufferedWriter FAILED_WRITER = null;
    private static int assetCount = 0;

    public static void main(String[] args) throws Exception {
        setProperties();

        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        GetCompanyInfoParam getCompanyInfoParam = new GetCompanyInfoParam();
        getCompanyInfoParam.setCompanyHandle(DEST_S7_COMPANY_HANDLE);

        marshaller = getMarshaller(getCompanyInfoParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(getCompanyInfoParam, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        String companyRootName = getCompanyRootFolderName(responseBody);

        System.out.println("INFO : Updating smart crop settings in account : " + companyRootName);

        Scanner cropFileScanner = new Scanner(INPUT_READER);
        String line = null;
        String[] data = null;

        int successCount = 0, failedCount = 0;

        while (cropFileScanner.hasNextLine()) {
            line = cropFileScanner.nextLine();
            data = line.split(",");

            if(data.length < 2){
                FAILED_WRITER.write(line);
                FAILED_WRITER.write("\r\n");

                failedCount++;
            }else{
                try{
                    updateSmartCrop(data, authHeaderStr, companyRootName);

                    successCount++;

                    SUCCESS_WRITER.write(line);
                    SUCCESS_WRITER.write("\r\n");
                }catch (Exception e){
                    System.out.println("ERROR: Updating smart crops for : " + line);
                    e.printStackTrace();
                    FAILED_WRITER.write(line);
                    FAILED_WRITER.write("\r\n");
                    failedCount++;
                }
            }

            assetCount++;
        }

        System.out.println("INFO: TOTAL ASSETS PROCESSED : " + assetCount);
        System.out.println("INFO: SUCCESS COUNT : " + successCount);
        System.out.println("INFO: FAILED (OR NO SMART CROPS EXIST) COUNT : " + failedCount);

        SUCCESS_WRITER.flush();
        SUCCESS_WRITER.close();

        FAILED_WRITER.flush();
        FAILED_WRITER.close();

        INPUT_READER.close();
    }

    private static void updateSmartCrop(String[] data, String authHeaderStr, String companyRootName) throws Exception{
        String assetPath = data[0];

        assetPath = companyRootName + assetPath.substring(assetPath.indexOf("/"));

        SearchAssetsByMetadataParam searchAssetsParam = getSearchAssetsByMetadataParam(assetPath);

        Marshaller marshaller = getMarshaller(searchAssetsParam.getClass());
        StringWriter sw = new StringWriter();
        marshaller.marshal(searchAssetsParam, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        String assetHandle = parseAssetHandleResponse(responseBody);

        Map<String, String> subAssetHandles = getSubAssetHandles(assetHandle);
        Map<String, Map<String, String>> cropsToUpdate = new HashMap<String, Map<String, String>>();

        Map<String, String> boundaries;
        String[] smartCropBounds;

        for(int i = 1; i < data.length; i++){
            String crops[] = data[i].split(":"); // name followed by crop settings eg. Small:leftN=0.0842912|topN=0.0650888|widthN=0.582375|heightN=0.899408
            boundaries = new HashMap<String, String>();

            smartCropBounds = crops[1].split("\\|");

            for (String smartCropBound : smartCropBounds) {
                String[] bound = smartCropBound.split("=");
                boundaries.put(bound[0], bound[1]);
            }

            cropsToUpdate.put(crops[0], boundaries);
        }

        UpdateSmartCropsParam updateSmartCropsParam = new UpdateSmartCropsParam();
        updateSmartCropsParam.setCompanyHandle(DEST_S7_COMPANY_HANDLE);

        SmartCropUpdateArray updateArray = new SmartCropUpdateArray();
        SmartCropUpdate smartCropUpdate = null;
        NormalizedCropRect cropRect = null;

        Iterator<Map.Entry<String, String>> subAssetHandlesItr =  subAssetHandles.entrySet().iterator();
        Map.Entry<String, String> entry;

        while(subAssetHandlesItr.hasNext()){
            entry = subAssetHandlesItr.next();

            smartCropUpdate = new SmartCropUpdate();
            smartCropUpdate.setOwnerHandle(assetHandle);
            smartCropUpdate.setSubAssetHandle(entry.getValue());

            cropRect = new NormalizedCropRect();
            boundaries = cropsToUpdate.get(entry.getKey());

            cropRect.setLeftN(Double.parseDouble(boundaries.get("leftN")));
            cropRect.setTopN(Double.parseDouble(boundaries.get("topN")));
            cropRect.setWidthN(Double.parseDouble(boundaries.get("widthN")));
            cropRect.setHeightN(Double.parseDouble(boundaries.get("heightN")));

            smartCropUpdate.setCropRect(cropRect);
            updateArray.getItems().add(smartCropUpdate);
        }

        updateSmartCropsParam.setUpdateArray(updateArray);

        marshaller = getMarshaller(updateSmartCropsParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(updateSmartCropsParam, sw);

        apiMethod = sw.toString();

        responseBody = getResponse(authHeaderStr, apiMethod);

        int totalUpdated = parseUpdateSmartCropResponse(responseBody);

        if(updateArray.getItems().size() != totalUpdated){
            throw new Exception("Updated count : " + totalUpdated + ", doesnt match total count : " + updateArray.getItems().size());
        }

        System.out.println("INFO: Updated smart crops for : " + assetPath);
    }

    private static int parseUpdateSmartCropResponse(byte[] responseBody) throws Exception{
        Map<String, String> subAssetHandles = new HashMap<String, String>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/updateSmartCropsReturn/successCount";

        Element element = (Element) xPath.compile(expression).evaluate(doc, XPathConstants.NODE);

        return Integer.parseInt(element.getTextContent());
    }

    private static String parseAssetHandleResponse(byte[] responseBody) throws Exception{
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/searchAssetsByMetadataReturn/assetSummaryArray/items/assetHandle";

        Element element = (Element) xPath.compile(expression).evaluate(doc, XPathConstants.NODE);

        return element.getTextContent();
    }

    public static Map<String, String> getSubAssetHandles(String assetHandle) throws Exception{
        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        GetAssociatedAssetsParam getAssociatedAssetsParam = new GetAssociatedAssetsParam();
        getAssociatedAssetsParam.setCompanyHandle(DEST_S7_COMPANY_HANDLE);
        getAssociatedAssetsParam.setAssetHandle(assetHandle);

        marshaller = getMarshaller(AuthHeader.class);
        sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        marshaller = getMarshaller(getAssociatedAssetsParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(getAssociatedAssetsParam, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        return parseSubAssetHandleResponse(responseBody);
    }

    private static Map<String, String> parseSubAssetHandleResponse(byte[] responseBody) throws Exception{
        Map<String, String> subAssetHandles = new HashMap<String, String>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/getAssociatedAssetsReturn/subAssetArray/items";

        NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);
        String subAssetHandle = null, name, cropRectStr;

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() == Node.ELEMENT_NODE) {
                Element eElement = (Element) item;

                subAssetHandle = eElement.getElementsByTagName("subAssetHandle").item(0).getTextContent();
                name = eElement.getElementsByTagName("name").item(0).getTextContent();

                subAssetHandles.put(name, subAssetHandle);
            }
        }

        return subAssetHandles;
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

            InputStream is = postMethod.getResponseBodyAsStream();

            responseBody = IOUtils.toByteArray(is);
        }finally{
            if(postMethod != null){
                postMethod.releaseConnection();
            }
        }

        return responseBody;
    }

    private static String getCompanyRootFolderName(byte[] responseBody) throws Exception{
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/getCompanyInfoReturn/companyInfo/rootPath";

        Element element = (Element) xPath.compile(expression).evaluate(doc, XPathConstants.NODE);

        return element.getTextContent();
    }

    private static SearchAssetsByMetadataParam getSearchAssetsByMetadataParam(String path){
        String folderPath = path.substring(0, path.lastIndexOf("/"));
        String assetName = path.substring(path.lastIndexOf("/") + 1);

        SearchAssetsByMetadataParam searchAssetsParam = new SearchAssetsByMetadataParam();
        MetadataConditionArray metaCondArray = new MetadataConditionArray();

        MetadataCondition condition = new MetadataCondition();
        condition.setFieldHandle("file_name");
        condition.setOp("Equals");
        condition.setValue(assetName);

        metaCondArray.getItems().add(condition);

        condition = new MetadataCondition();
        condition.setFieldHandle("folder_path");
        condition.setOp("Contains");
        condition.setValue(folderPath);

        metaCondArray.getItems().add(condition);

        searchAssetsParam.setCompanyHandle(DEST_S7_COMPANY_HANDLE);
        searchAssetsParam.setMetadataConditionArray(metaCondArray);

        return searchAssetsParam;
    }

    private static AuthHeader getS7AuthHeader(){
        AuthHeader authHeader = new AuthHeader();

        authHeader.setUser(DEST_S7_USER);
        authHeader.setPassword(DEST_S7_PASS);
        authHeader.setAppName(STAND_ALONE_APP_NAME);
        authHeader.setAppVersion("1.0");
        authHeader.setFaultHttpStatusCode(new Integer(200));

        return authHeader;
    }

    private static Marshaller getMarshaller(Class apiMethodClass) throws JAXBException {
        Marshaller marshaller = JAXBContext.newInstance(new Class[]{apiMethodClass}).createMarshaller();
        marshaller.setProperty("jaxb.formatted.output", Boolean.valueOf(true));
        marshaller.setProperty("jaxb.fragment", Boolean.valueOf(true));
        return marshaller;
    }

    private static void setProperties(){
        try{
            URL propFile = GenerateSmartCropsLog.class.getResource("config.properties");

            System.out.println("INFO : Reading configuration from : " + propFile.getPath());

            InputStream input = new FileInputStream(propFile.getPath());

            Properties prop = new Properties();
            prop.load(input);

            String destAccount = prop.getProperty("dest");

            if((destAccount == null) || destAccount.trim().equals("")){
                System.out.println("ERROR: 'dest' property not found in config.properties");
                System.exit(-1);
            }

            String[] words = destAccount.split("/");

            if(words.length != 3){
                System.out.println("ERROR: 'dest' property format is 's7CompanyHandle/user/pass' eg.'c|230095/user@company.com/password'");
                System.exit(-1);
            }

            DEST_S7_COMPANY_HANDLE = words[0];
            DEST_S7_USER = words[1];
            DEST_S7_PASS = words[2];

            SUCCESS_WRITER = new BufferedWriter(new FileWriter((new File(propFile.getPath())).getParentFile().getPath() + "/" + successLogName));
            FAILED_WRITER = new BufferedWriter(new FileWriter((new File(propFile.getPath())).getParentFile().getPath() + "/" + failedLogName));
            INPUT_READER = new BufferedReader(new FileReader((new File(propFile.getPath())).getParentFile().getPath() + "/" + inputLogName));
        }catch(Exception e){
            System.out.println("ERROR: Reading config.properties, is it in the current folder? - " + e.getMessage());
            e.printStackTrace();
            System.exit(-1);
        }
    }
}
