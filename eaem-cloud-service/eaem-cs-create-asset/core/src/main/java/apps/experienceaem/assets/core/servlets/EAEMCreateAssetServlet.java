package apps.experienceaem.assets.core.servlets;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.osgi.services.HttpClientBuilderFactory;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.apache.sling.api.wrappers.SlingHttpServletResponseWrapper;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONObject;
import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.RequestDispatcher;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.CharArrayWriter;
import java.io.IOException;
import java.io.PrintWriter;

@Component(
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.selectors=eaemcreateasset",
                "sling.servlet.methods=POST",
                "sling.servlet.resourceTypes=sling/servlet/default"
        }
)
public class EAEMCreateAssetServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(EAEMCreateAssetServlet.class);

    private static String INITIATE_UPLOAD_REQ = ".initiateUpload.json";
    public static String FILE_NAME = "fileName";
    public static String UPLOAD_TOKEN = "uploadToken";
    public static String MIME_TYPE = "mimeType";
    public static String FILE_SIZE = "fileSize";

    @Reference
    private HttpClientBuilderFactory httpClientBuilderFactory;

    private CloseableHttpClient httpClient;

    protected void activate(ComponentContext ctx) {
        HttpClientBuilder builder = httpClientBuilderFactory.newBuilder();

        RequestConfig requestConfig = RequestConfig.custom().setConnectTimeout(30000)
                                            .setSocketTimeout(30000).build();

        builder.setDefaultRequestConfig(requestConfig);

        httpClient = builder.build();
    }

    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        String fileName = request.getParameter("fileName");
        String fileContent = request.getParameter("fileContent");

        try {
            if (StringUtils.isEmpty(fileName)) {
                response.sendError(SlingHttpServletResponse.SC_FORBIDDEN, "fileName parameter missing");
                return;
            }

            int fileSize = fileContent.length();
            request.setAttribute(FILE_NAME, fileName);
            request.setAttribute(FILE_SIZE, fileSize);

            String initiateUploadResponse = makeInitiateUploadRequest(request, response);

            response.getWriter().print("initiateUpload Response : " + initiateUploadResponse);

            log.debug("initiateUpload Response : " + initiateUploadResponse);

            JSONObject uploadResponse = new JSONObject(initiateUploadResponse);
            JSONArray filesJSON = uploadResponse.getJSONArray("files");
            JSONObject fileJSON = (JSONObject) filesJSON.get(0);

            String binaryPOSTUrl = fileJSON.getJSONArray("uploadURIs").getString(0);

            response.getWriter().write("binaryPOSTUrl = " + binaryPOSTUrl);

            HttpPut put = new HttpPut(binaryPOSTUrl);
            HttpEntity entity = new StringEntity(fileContent);

            put.setEntity(entity);

            HttpResponse putResponse = httpClient.execute(put);
            int statusCode = putResponse.getStatusLine().getStatusCode();

            response.getWriter().print("Making Request....");

            if( (statusCode < 200) || (statusCode > 210)){
                response.sendError(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error uploading file - " + putResponse.getStatusLine().getReasonPhrase());
                return;
            }

            response.getWriter().print("putContent Response : " + putResponse);

            String completedResponse = makeCompleteUploadRequest(uploadResponse, request, response);

            response.getWriter().print("completeUpload Response : " + completedResponse);

            log.debug("completeUpload Response : " + completedResponse);
        } catch (Exception e) {
            log.error("Error creating file : {}", fileName);
            response.sendError(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error creating file - " + e.getMessage());
        }
    }

    private String makeCompleteUploadRequest(JSONObject uploadResponse, SlingHttpServletRequest request,
                                             SlingHttpServletResponse response) throws  Exception{
        JSONArray filesJSON = uploadResponse.getJSONArray("files");
        JSONObject fileJSON = (JSONObject) filesJSON.get(0);

        String uploadToken = fileJSON.getString("uploadToken");
        String mimeType = fileJSON.getString("mimeType");

        String completeURI = uploadResponse.getString("completeURI");

        request.setAttribute(UPLOAD_TOKEN, uploadToken);
        request.setAttribute(MIME_TYPE, mimeType);

        SlingHttpServletRequest wrapperRequest = new FileNameSlingServletRequestWrapper(request);
        SlingHttpServletResponse wrapperResponse = new EAEMSlingModelResponseWrapper(response);

        RequestDispatcher dp = wrapperRequest.getRequestDispatcher(completeURI);

        dp.include(wrapperRequest, wrapperResponse);

        return wrapperResponse.toString();
    }

    private String makeInitiateUploadRequest(SlingHttpServletRequest request, SlingHttpServletResponse response)
                        throws Exception{
        String folderPath = request.getResource().getPath();

        SlingHttpServletRequest wrapperRequest = new FileNameSlingServletRequestWrapper(request);
        RequestDispatcher dp = wrapperRequest.getRequestDispatcher(folderPath + INITIATE_UPLOAD_REQ);

        SlingHttpServletResponse wrapperResponse = new EAEMSlingModelResponseWrapper(response);

        dp.include(wrapperRequest, wrapperResponse);

        String uploadResponseStr = wrapperResponse.toString();

        if(StringUtils.isEmpty(uploadResponseStr)){
            response.sendError(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Empty upload response, file creation failed");
            return "";
        }

        //uploadResponseStr = getTestInitiateUploadResponse();

        return uploadResponseStr;
    }

    private String getTestInitiateUploadResponse(){
        return "{\n" +
                "\t\t\"folderPath\": \"/content/dam/experience-local\",\n" +
                "\t\t\"files\": [{\n" +
                "\t\t\t\"fileName\": \"sreek.txt\",\n" +
                "\t\t\t\"minPartSize\": 10485760,\n" +
                "\t\t\t\"maxPartSize\": 104857600,\n" +
                "\t\t\t\"uploadURIs\": [\"https://author-p10961-e90064.adobeaemcloud.com/aem-blob-ns-team-aem-cm-prd-n10103-cm-p10961-e90064/5463-d9f2-0d08-4ed1-a065-0101a364e6e8-1618604423753?sig=OMT7FTbsX5byn%2FsM6cCfyT6bX9zErYVYpakXNqKPCyA%3D&se=2021-04-17T08%3A20%3A23Z&sv=2019-02-02&sp=w&sr=b&blockId=MDAwMDAx&comp=block\"],\n" +
                "\t\t\t\"mimeType\": \"text/plain\",\n" +
                "\t\t\t\"uploadToken\": \"WWpFME9TMDRaamsxTFdGa05UQXROREJsTWkxaVlqRmlMVGxsTURkaVlUSTBaRFZsWlMweE5qRTROVEV5TmpnNU9URTFJekl3TWpFdE1EUXRNVFZVTVRnNk5URTZNamt1T1RFMU9ERTNXaU5QUkZsM1RXcFZlRTU2VFhST2VsRjZUMU13TUUweVNteE1WMGt5V1hwQmRGbHFaekZPUkdkNldsUlJNMDE2VG1nPSM3VTdGVjF6UnhwQnVpRnBGNVZNbGluRmJLZjA9\"\n" +
                "\t\t}],\n" +
                "\t\t\"completeURI\": \"/content/dam/experience-local.completeUpload.json\"\n" +
                "\t}";
    }

    private class EAEMSlingModelResponseWrapper extends SlingHttpServletResponseWrapper {
        private CharArrayWriter writer;

        public EAEMSlingModelResponseWrapper (final SlingHttpServletResponse response) {
            super(response);
            writer = new CharArrayWriter();
        }

        public PrintWriter getWriter() throws IOException {
            return new PrintWriter(writer);
        }

        public String toString() {
            return writer.toString();
        }
    }

    private class FileNameSlingServletRequestWrapper extends SlingHttpServletRequestWrapper {
        public FileNameSlingServletRequestWrapper(final SlingHttpServletRequest request) {
            super(request);
        }

        public String[] getParameterValues(String paramName) {
            if(EAEMCreateAssetServlet.FILE_NAME.equals(paramName)){
                return new String[] { String.valueOf(super.getAttribute(FILE_NAME)) };
            }else if(EAEMCreateAssetServlet.FILE_SIZE.equals(paramName)){
                return new String[] { String.valueOf(super.getAttribute(FILE_SIZE)) };
            }else if(EAEMCreateAssetServlet.UPLOAD_TOKEN.equals(paramName)){
                return new String[] { (String)super.getAttribute(UPLOAD_TOKEN) };
            }else if(EAEMCreateAssetServlet.MIME_TYPE.equals(paramName)){
                return new String[] { (String)super.getAttribute(MIME_TYPE) };
            }

            return super.getParameterValues(paramName);
        }
    }
}
