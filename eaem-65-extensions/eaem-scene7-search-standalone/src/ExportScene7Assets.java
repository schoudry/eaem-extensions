import com.scene7.ipsapi.*;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.ByteArrayRequestEntity;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.io.FileUtils;
import org.apache.http.client.fluent.Request;
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
import java.io.File;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class ExportScene7Assets {
    private static String S7_NA_IPS_URL = "https://s7sps1apissl.scene7.com/scene7/api/IpsApiService"; //available in AEM http://localhost:4502/libs/settings/dam/scene7/endpoints.html
    private static String S7_COMPANY_HANDLE = "c|230095"; //c|230095, c|9686 available via api or in AEM /conf/global/settings/cloudconfigs/dmscene7/jcr:content
    private static String S7_USER = "";
    private static String S7_PASS = "";
    private static String STAND_ALONE_APP_NAME = "Experiencing AEM";
    private static int assetCount = 0;
    private static String DOWNLOAD_ZIPS_LOCATION = "C:/dev/projects/eaem-extensions/eaem-65-extensions/eaem-scene7-search-standalone/out";

    public static void main(String[] args) throws Exception {
        new File(DOWNLOAD_ZIPS_LOCATION).mkdirs();

        browseFolder(null);

        System.out.println("TOTAL ASSETS : " + assetCount);
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
            System.out.println("No folders in account - " + S7_COMPANY_HANDLE);
            return;
        }

        if(folders.isEmpty()){
            System.out.println("No folders under - " + parentFolder.getFolderPath());
            return;
        }

        if(parentFolder == null){
            System.out.println(S7_COMPANY_HANDLE);
        }else{
            System.out.println(parentFolder.getFolderPath());
        }

        folders.forEach(folder -> {
            List<S7Asset> assets = folder.getAssets();

            assetCount = assetCount + assets.size();

            System.out.println("\t" + folder.getFolderPath() + " - " + assets.size());

            assets.forEach(asset -> {
                System.out.println("\t\t" + asset.getAssetPath() + " (" + FileUtils.byteCountToDisplaySize(asset.getAssetSize()) + ")");
            });

            if(!folder.getAssets().isEmpty()){
                try{
                    exportAssets(folder);
                }catch (Exception e){
                    System.out.println("ERROR EXPORTING ASSETS OF - " + folder.getFolderPath());
                }
            }
        });
    }

    private static void exportAssets(S7Folder folder) throws Exception{
        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        SubmitJobParam submitJobParam = getSubmitJobParam(folder);

        marshaller = getMarshaller(submitJobParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(submitJobParam, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        String exportJobHandle = parseSubmitJobResponse(responseBody, folder);

        if(exportJobHandle == null){
            return;
        }

        String exportZipUrl = getExportZipUrl(authHeaderStr, submitJobParam.getJobName());

        System.out.println("\t\tEXPORT ZIP URL - " + exportZipUrl);

        byte[] response = Request.Get(exportZipUrl).execute().returnContent().asBytes();

        if (response == null || response.length == 0) {
            throw new RuntimeException("Empty response for download request");
        }

        File zipFile = new File(DOWNLOAD_ZIPS_LOCATION + "/" + submitJobParam.getJobName() + ".zip");

        Files.write(Paths.get(zipFile.getAbsolutePath()), response);

        System.out.println("\t\tSAVED AS - " + zipFile.getAbsolutePath());
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


    private static String parseSubmitJobResponse(byte[] responseBody, S7Folder parentFolder) throws Exception{
        String expression = "/submitJobReturn/jobHandle";

        NodeList itemList = getDocumentNodeList(responseBody, expression);

        String exportJobHandle = null;

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(item.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            exportJobHandle = ((Element)item).getTextContent();

            System.out.println("\t\tEXPORT JOB - " + exportJobHandle);

            break;
        }

        return exportJobHandle;
    }

    private static List<S7Folder> parseResponse(byte[] responseBody, S7Folder parentFolder) throws Exception{
        List<S7Folder> folders = new ArrayList<S7Folder>();

        String expression = "/getFolderTreeReturn/folders";

        if(parentFolder != null){
            expression = "/getFolderTreeReturn/folders/subfolderArray";
        }

        NodeList itemList = getDocumentNodeList(responseBody, expression);

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            if(parentFolder != null){
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

            s7Folder.setFolderHandle(getTextContent(eElement, "folderHandle"));
            s7Folder.setFolderPath(getTextContent(eElement, "path"));
            s7Folder.setHasSubFolders(new Boolean(getTextContent(eElement, "hasSubfolders")));

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
        String expression = "/searchAssetsReturn/assetArray/items";

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

        parentFolder.setAssets(assets);
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

            System.out.println("REQUEST - " + requestBody);

            postMethod.setRequestEntity(new ByteArrayRequestEntity(requestBody.toString().getBytes()));

            int responseCode = httpclient.executeMethod(postMethod);

            if(responseCode != 200){
                System.out.println("Response code - " + responseCode + ", returning here...");
            }

            responseBody = postMethod.getResponseBody();

            System.out.println("RESPONSE - " + new String(responseBody));
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

    private static GetFolderTreeParam getGetFolderTreeParam(S7Folder s7Folder){
        GetFolderTreeParam getFolderTreeParam = new GetFolderTreeParam();

        getFolderTreeParam.setCompanyHandle(S7_COMPANY_HANDLE);

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
        assetTypes.getItems().add("Video");

        searchAssetsParam.setCompanyHandle(S7_COMPANY_HANDLE);
        searchAssetsParam.setFolder(s7Folder.getFolderPath());
        searchAssetsParam.setIncludeSubfolders(false);
        searchAssetsParam.setAssetTypeArray(assetTypes);

        return searchAssetsParam;
    }

    private static SubmitJobParam getSubmitJobParam(S7Folder s7Folder){
        SubmitJobParam submitJobParam = new SubmitJobParam();

        ExportJob exportJob = new ExportJob();
        exportJob.setFmt("orig");
        exportJob.setEmailSetting("All");

        HandleArray assetHandles = new HandleArray();

        s7Folder.getAssets().forEach( asset ->{
            assetHandles.getItems().add(asset.getAssetHandle());
        });

        exportJob.setAssetHandleArray(assetHandles);

        submitJobParam.setCompanyHandle(S7_COMPANY_HANDLE);
        submitJobParam.setJobName(getExportJobName(s7Folder.getFolderPath()));
        submitJobParam.setExportJob(exportJob);

        return submitJobParam;
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

    private static String getExportJobName(String folderPath){
        return folderPath.replaceAll("/", "_") + (new Date()).getTime();
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
            if(assets == null){
                return new ArrayList<>();
            }

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
    }
}
