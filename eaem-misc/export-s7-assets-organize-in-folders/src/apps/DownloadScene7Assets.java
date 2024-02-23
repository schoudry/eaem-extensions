package apps;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.StringWriter;
import java.util.*;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.ByteArrayRequestEntity;
import org.apache.commons.httpclient.methods.PostMethod;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.scene7.ipsapi.AuthHeader;
import com.scene7.ipsapi.ExportJob;
import com.scene7.ipsapi.GetActiveJobsParam;
import com.scene7.ipsapi.GetAssetsByNameParam;
import com.scene7.ipsapi.GetJobLogDetailsParam;
import com.scene7.ipsapi.HandleArray;
import com.scene7.ipsapi.StringArray;
import com.scene7.ipsapi.SubmitJobParam;

import java.net.URL;
import java.io.*;

public class DownloadScene7Assets {
    private static String S7_NA_IPS_URL = "https://s7sps1apissl.scene7.com/scene7/api/IpsApiService";
    private static String S7_COMPANY_HANDLE = "";
    private static String S7_USER = "";
    private static String S7_PASS = "";
    private static String STAND_ALONE_APP_NAME = "EAEM Export";
    private static String DOWNLOAD_ZIPS_LOCATION = "";
    private static final long MAX_LIMIT =  1_073_741_824 ;//1GB ;//524288000;//500MB 419292
    private static final long MAX_ASSET_LIMIT =  400;
    private static String inputLogName = "all-assets.csv";
    private static String successLogName = "downloaded-assets.csv";
    private static String zipUrlsLogName = "zip-urls.csv";
    private static BufferedReader INPUT_READER = null;
    private static BufferedWriter SUCCESS_WRITER = null;
    private static BufferedWriter ZIP_URL_WRITER = null;
    private static int START_WITH_LINE = 0;

    public static void main(String[] args) throws Exception {
        setProperties();

        browseAssets();
    }

    private static void browseAssets() throws Exception {
        Map<String, S7Asset> s7AssetListToExport = readInputFile(START_WITH_LINE);

        System.out.println("INFO: Total Asset Names count from input file is : " + s7AssetListToExport.size());

        if(s7AssetListToExport.isEmpty()) {
            System.out.println("INFO: No assets available for export");
            return;
        }

        try{
            exportAssets(s7AssetListToExport);
        }catch (Exception e){
            System.out.println("ERROR:  EXPORTING ASSETS OF - " + e.getMessage());
        }finally{
            SUCCESS_WRITER.flush();
            SUCCESS_WRITER.close();

            ZIP_URL_WRITER.flush();
            ZIP_URL_WRITER.close();

            INPUT_READER.close();
        }
    }

    private static void exportAssets(Map<String, S7Asset> s7Assets) throws Exception{
        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        //get job list
        List<SubmitJobParam> submitJobList = getSubmitJobParamList(s7Assets);

        for(SubmitJobParam submitJobParam : submitJobList) {
            marshaller = getMarshaller(submitJobParam.getClass());
            sw = new StringWriter();
            marshaller.marshal(submitJobParam, sw);

            String apiMethod = sw.toString();

            byte[] responseBody = getResponse(authHeaderStr, apiMethod);

            String exportJobHandle = parseSubmitJobResponse(responseBody);

            if(exportJobHandle == null){
                return;
            }

            String exportZipUrl = getExportZipUrl(authHeaderStr, submitJobParam.getJobName());

            System.out.println("INFO: EXPORT ZIP URL - " + exportZipUrl);

            ZIP_URL_WRITER.write(exportZipUrl);
            ZIP_URL_WRITER.write("\r\n");

            ZIP_URL_WRITER.flush();

            /*byte[] response = Request.Get(exportZipUrl).execute().returnContent().asBytes();

            if (response == null || response.length == 0) {
                throw new RuntimeException("Empty response for download request");
            }

            File zipFile = new File(DOWNLOAD_ZIPS_LOCATION + "/" + submitJobParam.getJobName() + ".zip");

            Files.write(Paths.get(zipFile.getAbsolutePath()), response);

            System.out.println("INFO: SAVED AS - " + zipFile.getAbsolutePath());*/

            writeToSuccessLog(submitJobParam, s7Assets);

            Thread.sleep(1000);
        }
    }

    private static void writeToSuccessLog(SubmitJobParam submitJobParam, Map<String, S7Asset> s7Assets) throws Exception{
        HandleArray assetHandleArray = submitJobParam.getExportJob().getAssetHandleArray();
        Iterator<String> assetHandles = assetHandleArray.getItems().iterator();

        while(assetHandles.hasNext()){
            String assetHandle = assetHandles.next();
            S7Asset asset = s7Assets.get(assetHandle);

            SUCCESS_WRITER.write(asset.getAssetPath() + "," + asset.getAssetHandle() + "," + asset.getAssetSize());
            SUCCESS_WRITER.write("\r\n");
        }

        SUCCESS_WRITER.flush();
    }

    private static String getExportZipUrl(String authHeaderStr, String jobName) throws Exception{
        String exportZipUrl = null;

        do{
            Thread.sleep(500);

            exportZipUrl = pingJobStatus(authHeaderStr, jobName);
        }while( exportZipUrl == null);

        return exportZipUrl;
    }

    private static String pingJobStatus(String authHeaderStr, String jobName) throws Exception{
        GetJobLogDetailsParam getJobLogDetails = getJobLogDetails(jobName);

        Marshaller marshaller = getMarshaller(getJobLogDetails.getClass());
        StringWriter sw = new StringWriter();
        marshaller.marshal(getJobLogDetails, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        return parseJobLogResponse(responseBody);
    }

    private static String parseJobLogResponse(byte[] responseBody) throws Exception{
        String expression = "//assetName[starts-with(text(),'http')]";

        NodeList itemList = getDocumentNodeList(responseBody, expression);

        String exportZipUrl = null;

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            exportZipUrl = ((Element)item).getTextContent();

            break;
        }

        return exportZipUrl;
    }


    private static String parseSubmitJobResponse(byte[] responseBody) throws Exception{
        String expression = "/submitJobReturn/jobHandle";

        NodeList itemList = getDocumentNodeList(responseBody, expression);

        String exportJobHandle = null;

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            exportJobHandle = ((Element)item).getTextContent();

            System.out.println("INFO: EXPORT JOB - " + exportJobHandle);

            break;
        }

        return exportJobHandle;
    }


    private static List<S7Asset> parseSearchByNameResponse(byte[] responseBody) throws Exception{
        ArrayList<String> assetHandleArray = new ArrayList<>();
        String expression = "/getAssetsByNameReturn/assetArray/items";

        NodeList itemList = getDocumentNodeList(responseBody, expression);

        List<S7Asset> assets = new ArrayList<S7Asset>();

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            S7Asset s7asset = new S7Asset();

            Element eElement = (Element) item;

            s7asset.setAssetHandle(getTextContent(eElement, "assetHandle"));
            assetHandleArray.add(getTextContent(eElement, "assetHandle"));
            s7asset.setAssetPath(getTextContent(eElement, "folder") + getTextContent(eElement, "fileName"));

            NodeList imageInfoList = eElement.getElementsByTagName("imageInfo");

            for (int j = 0; j < imageInfoList.getLength(); j++) {
                Node imageInfo = imageInfoList.item(j);

                if(imageInfo.getNodeType() != Node.ELEMENT_NODE) {
                    continue;
                }

                s7asset.setAssetSize(new Long(getTextContent((Element)imageInfo, "fileSize")));
            }

            assets.add(s7asset);
        }

        return assets;
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
                System.out.println("ERROR: Response code - " + responseCode + ", returning here...");
                throw new Exception("Error processing response, status not 200");
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

    private static GetAssetsByNameParam getAssetsByNameParam(List<String> fileNamesToBeExported){
        GetAssetsByNameParam searchAssetsParam = new GetAssetsByNameParam();
        StringArray nameArray = new StringArray();

        for (Iterator iterator = fileNamesToBeExported.iterator(); iterator.hasNext();) {
            String fileName = (String) iterator.next();
            nameArray.getItems().add(fileName);
        }

        StringArray assetTypes = new StringArray();
        assetTypes.getItems().add("Image");
        searchAssetsParam.setAssetTypeArray(assetTypes);
        searchAssetsParam.setCompanyHandle(S7_COMPANY_HANDLE);
        searchAssetsParam.setNameArray(nameArray);
        searchAssetsParam.setResponseFieldArray( getStringArray(new String[]{
                "assetArray/items/assetHandle",
                "assetArray/items/type",
                "assetArray/items/fileName",
                "assetArray/items/folder",
                "assetArray/items/imageInfo/fileSize",
                "totalRows"
        }) );

        return searchAssetsParam;
    }

    private static List<SubmitJobParam> getSubmitJobParamList(Map<String, S7Asset> s7Assets){
        List<SubmitJobParam> submitJobList = new ArrayList<SubmitJobParam>();
        long overallSize = 0;

        HandleArray assetHandlesArray = new HandleArray();

        List<HandleArray> assetHandleList = new ArrayList<HandleArray>();

        int index = 0;

        for(S7Asset asset : s7Assets.values()){
            index++;

            overallSize = overallSize + asset.getAssetSize();

            if (overallSize > MAX_LIMIT || index > MAX_ASSET_LIMIT) {
                overallSize = asset.getAssetSize(); //Total asset size should be equal to current asset size
                index = 1;
                assetHandleList.add(assetHandlesArray);
                assetHandlesArray = new HandleArray();
            }

            assetHandlesArray.getItems().add(asset.getAssetHandle());
        }

        assetHandleList.add(assetHandlesArray);

        index = 0;

        for(HandleArray handleArray : assetHandleList){
            SubmitJobParam submitJobParam = new SubmitJobParam();
            ExportJob exportJob = new ExportJob();
            exportJob.setFmt("orig");
            exportJob.setEmailSetting("All");
            exportJob.setAssetHandleArray(handleArray);

            submitJobParam.setCompanyHandle(S7_COMPANY_HANDLE);
            submitJobParam.setJobName(getExportJobName(index + "_EAEM_bulk_export_"));
            submitJobParam.setExportJob(exportJob);

            submitJobList.add(submitJobParam);
            index++;
        }

        return submitJobList;
    }

    private static GetJobLogDetailsParam getJobLogDetails(String origJobName){
        GetJobLogDetailsParam getJobLogDetailsParam = new GetJobLogDetailsParam();

        getJobLogDetailsParam.setCompanyHandle(S7_COMPANY_HANDLE);
        getJobLogDetailsParam.setOriginalName(origJobName);

        return getJobLogDetailsParam;
    }

    private static GetActiveJobsParam getActiveJobsParam(String jobHandle){
        GetActiveJobsParam getActiveJobsParam = new GetActiveJobsParam();

        getActiveJobsParam.setCompanyHandle(S7_COMPANY_HANDLE);
        getActiveJobsParam.setJobHandle(jobHandle);

        return getActiveJobsParam;
    }

    private static NodeList getDocumentNodeList(byte[] responseBody, String expression) throws Exception{
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        return (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);
    }

    private static String getExportJobName(String prefix){
        return prefix.replaceAll("/", "_") + (new Date()).getTime();
    }

    private static Marshaller getMarshaller(Class apiMethodClass) throws JAXBException {
        Marshaller marshaller = JAXBContext.newInstance(new Class[]{apiMethodClass}).createMarshaller();
        marshaller.setProperty("jaxb.formatted.output", Boolean.valueOf(true));
        marshaller.setProperty("jaxb.fragment", Boolean.valueOf(true));
        return marshaller;
    }

    private static class S7Asset{
        private String assetName;
        private String assetHandle;
        private String assetPath;
        private long assetSize;

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

        public String getAssetName() {
            return assetName;
        }

        public void setAssetName(String assetName) {
            this.assetName = assetName;
        }
    }

    private static void setProperties(){
        try{
            URL propFile = DownloadScene7Assets.class.getResource("config.properties");

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
                System.out.println("ERROR: 'src' property format is 's7CompanyHandle/user/pass' eg.'c|99999/user@adobe.com/password'");
                System.exit(-1);
            }

            S7_COMPANY_HANDLE = words[0];
            S7_USER = words[1];
            S7_PASS = words[2];

            String downloadPath = (new File(propFile.getPath())).getParentFile().getPath();

            DOWNLOAD_ZIPS_LOCATION = downloadPath;
            SUCCESS_WRITER = new BufferedWriter(new FileWriter(downloadPath + "/" + successLogName));
            INPUT_READER = new BufferedReader(new FileReader(downloadPath + "/" + inputLogName));
            ZIP_URL_WRITER = new BufferedWriter(new FileWriter(downloadPath + "/" + zipUrlsLogName));
        }catch(Exception e){
            System.out.println("ERROR: Reading config.properties, is it in the current folder? - " + e.getMessage());
            e.printStackTrace();
            System.exit(-1);
        }
    }

    public static StringArray getStringArray(String[] args){
        StringArray tmp = new StringArray();
        for (String string : args){
            if (string != null){
                tmp.getItems().add(string);
            }
        }
        return tmp;
    }

    private static Map<String, S7Asset> readInputFile(int skipLines){
        Scanner fileScanner = new Scanner(INPUT_READER);
        String line = null;
        String[] data = null;
        int index = 0;

        Map<String, S7Asset> s7Assets = new HashMap<String, S7Asset>();

        while (fileScanner.hasNextLine()) {
            line = fileScanner.nextLine();

            if(index++ < skipLines){
                continue;
            }

            data = line.split(",");

            S7Asset s7Asset = new S7Asset();

            s7Asset.setAssetPath(data[0]);
            s7Asset.setAssetName(data[0].substring(data[0].lastIndexOf("/") + 1));
            s7Asset.setAssetHandle(data[1]);
            s7Asset.setAssetSize(new Integer(data[2]));

            s7Assets.put(s7Asset.getAssetHandle(), s7Asset);
        }

        return s7Assets;
    }
}


