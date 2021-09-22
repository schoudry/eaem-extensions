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

public class GenerateSmartCropsLog {
    private static String S7_NA_IPS_URL = "https://s7sps1apissl.scene7.com/scene7/api/IpsApiService";
    private static String SRC_S7_COMPANY_HANDLE = "";
    private static String SRC_S7_USER = "";
    private static String SRC_S7_PASS = "";
    private static String STAND_ALONE_APP_NAME = "Experiencing AEM";
    private static String logName = "all-smart-crops.csv";
    private static BufferedWriter LOG_WRITER = null;
    private static int assetCount = 0;

    public static void main(String[] args) throws Exception {
        String path = setProperties();

        if((path == null) || path.trim().isEmpty()){
            System.out.println("INFO : Reading smart crops of all assets in account : " + SRC_S7_COMPANY_HANDLE);

            browseFolder(null);
        }else{
            System.out.println("INFO : Reading smart crops of all assets in folder and sub folders : " + path);

            S7Folder rootFolder = new S7Folder();

            rootFolder.setFolderPath(path);

            browseFolder(rootFolder);
        }

        System.out.println("TOTAL ASSETS READ : " + assetCount);

        LOG_WRITER.flush();
        LOG_WRITER.close();
    }

    private static String setProperties(){
        String path = "";

        try{
            URL propFile = GenerateSmartCropsLog.class.getResource("config.properties");

            System.out.println("INFO : Reading configuration from : " + propFile.getPath());

            InputStream input = new FileInputStream(propFile.getPath());

            Properties prop = new Properties();
            prop.load(input);

            String srcAccount = prop.getProperty("src");

            if((srcAccount == null) || srcAccount.trim().equals("")){
                System.out.println("ERROR: 'src' property not found in config.properties");
                System.exit(-1);
            }

            String[] words = srcAccount.split("/");

            if(words.length != 3){
                System.out.println("ERROR: 'src' property format is 's7CompanyHandle/user/pass' eg.'c|230095/user@company.com/password'");
                System.exit(-1);
            }

            SRC_S7_COMPANY_HANDLE = words[0];
            SRC_S7_USER = words[1];
            SRC_S7_PASS = words[2];

            path = prop.getProperty("path");

            LOG_WRITER = new BufferedWriter(new FileWriter((new File(propFile.getPath())).getParentFile().getPath() + "/" + logName));
        }catch(Exception e){
            System.out.println("ERROR: Reading config.properties, is it in the current folder? - " + e.getMessage());
            e.printStackTrace();
            System.exit(-1);
        }

        return path;
    }

    private static void browseFolder(S7Folder s7Folder) throws Exception {
        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        GetFolderTreeParam getFolderTreeParam = getGetFolderTreeParam(s7Folder);

        marshaller = getMarshaller(getFolderTreeParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(getFolderTreeParam, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        List<S7Folder> folders = parseResponse(responseBody, s7Folder);

        folders.forEach(folder -> {
            if(folder.isHasSubFolders()){
                try{
                    browseFolder(folder);
                }catch (Exception e){
                    e.printStackTrace();
                }
            }
        });

        printFolders(s7Folder, folders);
    }

    private static void printFolders(S7Folder parentFolder, List<S7Folder> folders){
        if( ( parentFolder == null ) && folders.isEmpty()){
            System.out.println("No folders or assets in account - " + SRC_S7_COMPANY_HANDLE);
            return;
        }

        if(folders.isEmpty()){
            System.out.println("No folders or assets under - " + parentFolder.getFolderPath());
            return;
        }

        if(parentFolder == null){
            System.out.println(SRC_S7_COMPANY_HANDLE);
        }else{
            System.out.println(parentFolder.getFolderPath());
        }

        folders.forEach(folder -> {
            List<S7Asset> assets = folder.getAssets();

            assetCount = assetCount + assets.size();

            System.out.println("\t" + folder.getFolderPath() + " - " + assets.size());

            assets.forEach(asset -> {
                try {
                    LOG_WRITER.write(asset.getAssetPath() + "," + asset.getCropRectsStr());
                    LOG_WRITER.write("\r\n");
                    LOG_WRITER.flush();
                }catch (Exception lw){
                    System.out.println("ERROR: writing to log : " + lw.getMessage());
                }
            });
        });
    }

    private static List<S7Folder> parseResponse(byte[] responseBody, S7Folder parentFolder) throws Exception{
        List<S7Folder> folders = new ArrayList<S7Folder>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/getFolderTreeReturn/folders";

        if( (parentFolder != null) && (parentFolder.getFolderHandle() != null)){
            expression = "/getFolderTreeReturn/folders/subfolderArray";
        }

        NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if( (parentFolder != null) && (parentFolder.getFolderHandle() != null)){
                NodeList childList = item.getChildNodes();

                for (int j = 0; j < childList.getLength(); j++) {
                    folders.add(fillFolderDetail(childList.item(j)));
                }
            }else{
                folders.add(fillFolderDetail(item));
            }
        }

        return folders;
    }

    private static S7Folder fillFolderDetail(Node item) throws Exception{
        S7Folder s7Folder = new S7Folder();

        if(item.getNodeType() == Node.ELEMENT_NODE) {
            Element eElement = (Element) item;

            s7Folder.setFolderHandle(eElement.getElementsByTagName("folderHandle").item(0).getTextContent());
            s7Folder.setFolderPath(eElement.getElementsByTagName("path").item(0).getTextContent());
            s7Folder.setHasSubFolders(new Boolean(eElement.getElementsByTagName("hasSubfolders").item(0).getTextContent()));

            fillAssetDetails(s7Folder);
        }

        return s7Folder;
    }

    private static void fillAssetDetails(S7Folder s7Folder) throws Exception{
        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        SearchAssetsParam searchAssetsParam = getSearchAssetsParam(s7Folder);

        marshaller = getMarshaller(searchAssetsParam .getClass());
        sw = new StringWriter();
        marshaller.marshal(searchAssetsParam , sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        parseSearchResponse(responseBody, s7Folder);
    }

    private static void parseSearchResponse(byte[] responseBody, S7Folder parentFolder) throws Exception{
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/searchAssetsReturn/assetArray/items";

        NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);

        List<S7Asset> assets = new ArrayList<S7Asset>();

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            S7Asset s7asset = new S7Asset();

            Element eElement = (Element) item;

            s7asset.setType(getTextContent(eElement, "type"));
            s7asset.setAssetHandle(getTextContent(eElement, "assetHandle"));
            s7asset.setAssetPath(getTextContent(eElement, "folder") + getTextContent(eElement, "fileName"));

            NodeList imageInfoList = eElement.getElementsByTagName("imageInfo");

            for (int j = 0; j < imageInfoList.getLength(); j++) {
                Node imageInfo = imageInfoList.item(j);

                if(imageInfo.getNodeType() != Node.ELEMENT_NODE) {
                    continue;
                }

                s7asset.setAssetSize(new Long(getTextContent((Element)imageInfo, "fileSize")));

            }

            if("Image".equals(s7asset.getType())){
                Map<String, String> cropRects = getSmartCropsCropRects(s7asset.getAssetHandle());

                s7asset.setCropRects(cropRects);
            }

            assets.add(s7asset);
        }

        parentFolder.setAssets(assets);
    }

    public static Map<String, String> getSmartCropsCropRects(String assetHandle) throws Exception{
        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        GetAssociatedAssetsParam getAssociatedAssetsParam = new GetAssociatedAssetsParam();
        getAssociatedAssetsParam.setCompanyHandle(SRC_S7_COMPANY_HANDLE);
        getAssociatedAssetsParam.setAssetHandle(assetHandle);

        marshaller = getMarshaller(AuthHeader.class);
        sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        marshaller = getMarshaller(getAssociatedAssetsParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(getAssociatedAssetsParam, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        return parseResponseForCropRects(responseBody);
    }

    private static Map<String, String> parseResponseForCropRects(byte[] responseBody) throws Exception{
        Map<String, String> cropRects = new HashMap<String, String>();

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

                try{
                    Element cropRectEle = (Element)((Element)eElement.getElementsByTagName("smartCrop").item(0))
                                                .getElementsByTagName("cropRect").item(0);

                    cropRectStr = getCropRectStr(cropRectEle);
                }catch(Exception ce){
                    //ignore no smart crop images
                    cropRectStr = "";
                }

                cropRects.put(name, cropRectStr);
            }
        }

        return cropRects;
    }

    private static String getCropRectStr(Element cropRectEle){
        StringWriter sw = new StringWriter();

        sw.append("leftN=").append(cropRectEle.getElementsByTagName("leftN").item(0).getTextContent()).append("|");
        sw.append("topN=").append(cropRectEle.getElementsByTagName("topN").item(0).getTextContent()).append("|");
        sw.append("widthN=").append(cropRectEle.getElementsByTagName("widthN").item(0).getTextContent()).append("|");
        sw.append("heightN=").append(cropRectEle.getElementsByTagName("heightN").item(0).getTextContent()).append("|");

        return sw.toString();
    }

    private static String getTextContent(Element eElement, String tagName){
        return eElement.getElementsByTagName(tagName).item(0).getTextContent();
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

    private static AuthHeader getS7AuthHeader(){
        AuthHeader authHeader = new AuthHeader();

        authHeader.setUser(SRC_S7_USER);
        authHeader.setPassword(SRC_S7_PASS);
        authHeader.setAppName(STAND_ALONE_APP_NAME);
        authHeader.setAppVersion("1.0");
        authHeader.setFaultHttpStatusCode(new Integer(200));

        return authHeader;
    }

    private static GetFolderTreeParam getGetFolderTreeParam(S7Folder s7Folder){
        GetFolderTreeParam getFolderTreeParam = new GetFolderTreeParam();

        getFolderTreeParam.setCompanyHandle(SRC_S7_COMPANY_HANDLE);

        getFolderTreeParam.setDepth(1);

        if(s7Folder != null){
            getFolderTreeParam.setFolderPath(s7Folder.getFolderPath());
        }

        return getFolderTreeParam;
    }

    private static SearchAssetsParam getSearchAssetsParam(S7Folder s7Folder){
        SearchAssetsParam searchAssetsParam = new SearchAssetsParam();
        StringArray assetTypes = new StringArray();
        assetTypes.getItems().add("Image");

        searchAssetsParam.setCompanyHandle(SRC_S7_COMPANY_HANDLE);
        searchAssetsParam.setFolder(s7Folder.getFolderPath());
        searchAssetsParam.setIncludeSubfolders(false);
        searchAssetsParam.setAssetTypeArray(assetTypes);

        return searchAssetsParam;
    }

    private static Marshaller getMarshaller(Class apiMethodClass) throws JAXBException {
        Marshaller marshaller = JAXBContext.newInstance(new Class[]{apiMethodClass}).createMarshaller();
        marshaller.setProperty("jaxb.formatted.output", Boolean.valueOf(true));
        marshaller.setProperty("jaxb.fragment", Boolean.valueOf(true));
        return marshaller;
    }

    private static class S7Folder{
        private String folderHandle;
        private String folderPath;
        private boolean hasSubFolders;
        private List<S7Asset> assets;

        public String getFolderHandle() {
            return folderHandle;
        }

        public void setFolderHandle(String folderHandle) {
            this.folderHandle = folderHandle;
        }

        public String getFolderPath() {
            return folderPath;
        }

        public void setFolderPath(String folderPath) {
            this.folderPath = folderPath;
        }

        public boolean isHasSubFolders() {
            return hasSubFolders;
        }

        public void setHasSubFolders(boolean hasSubFolders) {
            this.hasSubFolders = hasSubFolders;
        }

        public List<S7Asset> getAssets() {
            return assets;
        }

        public void setAssets(List<S7Asset> assets) {
            this.assets = assets;
        }

        public String toString(){
            return "[" + folderHandle + "," + folderPath + "," + hasSubFolders + "]";
        }
    }

    private static class S7Asset{
        private String type;
        private String assetHandle;
        private String assetPath;
        private long assetSize;
        private Map<String, String> cropRects;

        public String getAssetHandle() {
            return assetHandle;
        }

        public void setAssetHandle(String assetHandle) {
            this.assetHandle = assetHandle;
        }

        public String getAssetPath() {
            return assetPath;
        }

        public void setAssetPath(String assetPath) {
            this.assetPath = assetPath;
        }

        public long getAssetSize() {
            return assetSize;
        }

        public void setAssetSize(long assetSize) {
            this.assetSize = assetSize;
        }

        public Map<String, String> getCropRects() {
            return cropRects;
        }

        public String getCropRectsStr() {
            if(cropRects == null){
                return "";
            }

            StringWriter sw = new StringWriter();

            cropRects.forEach((k, v) -> sw.append(k).append(":").append(v).append(","));

            return sw.toString();
        }

        public void setCropRects(Map<String, String> cropRects) {
            this.cropRects = cropRects;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }
}
