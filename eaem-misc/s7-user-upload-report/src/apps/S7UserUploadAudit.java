package apps;

import com.scene7.ipsapi.AuthHeader;
import com.scene7.ipsapi.GetJobLogsParam;
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

public class S7UserUploadAudit {
    private static String S7_NA_IPS_URL = "https://s7sps1apissl.scene7.com/scene7/api/IpsApiService";
    private static String SRC_S7_COMPANY_HANDLE = "";
    private static String SRC_S7_USER = "";
    private static String SRC_S7_PASS = "";
    private static String STAND_ALONE_APP_NAME = "Experience AEM";
    private static String logName = "user-uploads.csv";
    private static BufferedWriter LOG_WRITER = null;
    private static int assetCount = 0;

    public static void main(String[] args) throws Exception {
        setProperties();

        System.out.println("INFO : Reading all uploads for company : " + SRC_S7_COMPANY_HANDLE);

        getJogLogs();

        LOG_WRITER.flush();
        LOG_WRITER.close();
    }

    private static void getJogLogs() throws Exception {
        AuthHeader authHeader = getS7AuthHeader();

        Marshaller marshaller = getMarshaller(AuthHeader.class);
        StringWriter sw = new StringWriter();
        marshaller.marshal(authHeader, sw);

        String authHeaderStr = sw.toString();

        GetJobLogsParam getJobLogsParam = getGetJobLogsParam();

        marshaller = getMarshaller(getJobLogsParam.getClass());
        sw = new StringWriter();
        marshaller.marshal(getJobLogsParam, sw);

        String apiMethod = sw.toString();

        byte[] responseBody = getResponse(authHeaderStr, apiMethod);

        Map<String, List<S7JobDetails>> jobsList = parseResponse(responseBody);

        System.out.println(jobsList);
    }

    private static void writeJobDetailsToLog(List<S7JobDetails> jobDetails){
        if(jobDetails.isEmpty()){
            System.out.println("NO JOB DETAILS available for company : " + SRC_S7_COMPANY_HANDLE);
            return;
        }

        jobDetails.forEach(folder -> {
            jobDetails.stream().forEach(job -> {
                try {
                    LOG_WRITER.write(job.getUserEmail() + "," + job.getTotalFileCount());
                    LOG_WRITER.write("\r\n");
                    LOG_WRITER.flush();
                }catch (Exception lw){
                    System.out.println("ERROR: writing to log : " + lw.getMessage());
                }
            });
        });
    }

    private static GetJobLogsParam getGetJobLogsParam(){
        GetJobLogsParam getJobLogsParam = new GetJobLogsParam();

        getJobLogsParam.setCompanyHandle(SRC_S7_COMPANY_HANDLE);

        return getJobLogsParam;
    }

    private static Map<String, List<S7JobDetails>> parseResponse(byte[] responseBody) throws Exception{
        Map<String, List<S7JobDetails>> jobs = new HashMap<String, List<S7JobDetails>>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        DocumentBuilder builder = factory.newDocumentBuilder();

        ByteArrayInputStream input =  new ByteArrayInputStream(responseBody);

        Document doc = builder.parse(input);

        XPath xPath =  XPathFactory.newInstance().newXPath();

        String expression = "/getJobLogsReturn/jobLogArray/items";

        NodeList itemList = (NodeList) xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);

        for (int i = 0; i < itemList.getLength(); i++) {
            Node item = itemList.item(i);

            S7JobDetails jobDetails = fillJobDetails(item);

            if(!jobDetails.getLogType().equalsIgnoreCase(S7JobDetails.LOG_TYPE.BEGINUPLOAD.toString())){
                continue;
            }

            List<S7JobDetails> jobDetailsList = jobs.get(jobDetails.getUserEmail());

            if(jobDetailsList == null){
                jobDetailsList = new ArrayList<S7JobDetails>();
            }

            jobDetailsList.add(jobDetails);

            jobs.put(jobDetails.getUserEmail(), jobDetailsList);
        }

        return jobs;
    }

    private static S7JobDetails fillJobDetails(Node item) throws Exception{
        S7JobDetails jobDetails = new S7JobDetails();

        if(item.getNodeType() == Node.ELEMENT_NODE) {
            Element eElement = (Element) item;

            String logType = getTextContent(eElement, "logType");
            jobDetails.setLogType(logType);

            jobDetails.setJobHandle(getTextContent(eElement, "jobHandle"));
            jobDetails.setJobName(getTextContent(eElement, "jobName"));
            jobDetails.setUserEmail(getTextContent(eElement, "submitUserEmail"));
            jobDetails.setTotalFileCount(Integer.valueOf(getTextContent(eElement, "totalFileCount")));
        }

        return jobDetails;
    }

    private static Marshaller getMarshaller(Class apiMethodClass) throws JAXBException {
        Marshaller marshaller = JAXBContext.newInstance(new Class[]{apiMethodClass}).createMarshaller();
        marshaller.setProperty("jaxb.formatted.output", Boolean.valueOf(true));
        marshaller.setProperty("jaxb.fragment", Boolean.valueOf(true));
        return marshaller;
    }

    private static void setProperties(){
        try{
            URL propFile = GetScene7AssetPathsAndSize.class.getResource("config.properties");

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
                System.out.println("ERROR: 'src' property format is 's7CompanyHandle/user/pass' eg.'c|999999/user@adobe.com/password'");
                System.exit(-1);
            }

            SRC_S7_COMPANY_HANDLE = words[0];
            SRC_S7_USER = words[1];
            SRC_S7_PASS = words[2];

            String assetLogFilePath = (new File(propFile.getPath())).getParentFile().getPath() + "/" + logName;

            System.out.println("INFO: Writing uploads to csv file : " + assetLogFilePath);

            LOG_WRITER = new BufferedWriter(new FileWriter(assetLogFilePath));
        }catch(Exception e){
            System.out.println("ERROR: Reading config.properties, is it in the current folder? - " + e.getMessage());
            e.printStackTrace();
            System.exit(-1);
        }
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

    private static class S7JobDetails{
        public enum LOG_TYPE {
            BEGINUPLOAD
        }

        private String jobHandle = "";
        private String jobName = "";
        private String logType = "";
        private String userEmail = "";
        private int totalFileCount = 0;

        public String getJobHandle() {
            return jobHandle;
        }

        public void setJobHandle(String jobHandle) {
            this.jobHandle = jobHandle;
        }

        public String getJobName() {
            return jobName;
        }

        public void setJobName(String jobName) {
            this.jobName = jobName;
        }

        public String getLogType() {
            return logType;
        }

        public void setLogType(String logType) {
            this.logType = logType;
        }

        public String getUserEmail() {
            return userEmail;
        }

        public void setUserEmail(String userEmail) {
            this.userEmail = userEmail;
        }

        public int getTotalFileCount() {
            return totalFileCount;
        }

        public void setTotalFileCount(int totalFileCount) {
            this.totalFileCount = totalFileCount;
        }

        public String toString(){
            return "'" + logType + "," + userEmail + "," + jobName + "," + jobHandle + "'\n";
        }
    }
}
