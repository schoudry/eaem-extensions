package apps;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;

import org.apache.http.client.fluent.Form;
import org.apache.http.client.fluent.Request;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;

/**
 * Created by nalabotu on 6/11/2021.
 */
public class UploadToAEMCS {
    public static String AEM_CS_HOST = "https://author-p10961-e90064.adobeaemcloud.com";
    public static String AEM_FOLDER = "/content/dam/experience-aem";
    public static String INPUT_FILE = "C:/Users/nalabotu/Pictures/adobe.jpg";
    public static String BEARER_TOKEN = "eyJhbGc...........";

    public static String INITIATE_UPLOAD_REQ = AEM_CS_HOST + AEM_FOLDER + ".initiateUpload.json";
    public static String FILE_NAME = "fileName";
    public static String UPLOAD_TOKEN = "uploadToken";
    public static String MIME_TYPE = "mimeType";
    public static String FILE_SIZE = "fileSize";

    public static void main(String[] args) throws Exception {
        String initiateUploadResponse = makeInitiateUploadRequest();

        JSONObject uploadResponse = new JSONObject(initiateUploadResponse);
        JSONArray filesJSON = uploadResponse.getJSONArray("files");
        JSONObject fileJSON = (JSONObject) filesJSON.get(0);

        FileInputStream fileIn = new FileInputStream(INPUT_FILE);
        byte[] fileBytes = IOUtils.toByteArray(fileIn);

        String binaryPUTUrl = fileJSON.getJSONArray("uploadURIs").getString(0);
        HttpResponse putResponse = Request.Put(binaryPUTUrl)
                .bodyByteArray(fileBytes).execute().returnResponse();

        int statusCode = putResponse.getStatusLine().getStatusCode();

        if( (statusCode < 200) || (statusCode > 210)){
            throw new Exception("Error uploading the binary");
        }

        String completeResponse = makeCompleteUploadRequest(uploadResponse);

        System.out.println("Uploaded : " + (AEM_FOLDER + completeResponse) );
    }

    private static String makeInitiateUploadRequest()throws Exception{
        File inputFile = new File(INPUT_FILE);

        Form form = Form.form();
        form.add(FILE_NAME, inputFile.getName());
        form.add(FILE_SIZE, String.valueOf(inputFile.length()));

        String initiateUploadResponse = Request.Post(INITIATE_UPLOAD_REQ)
                .addHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                .addHeader("Authorization", "Bearer " + BEARER_TOKEN)
                .bodyForm(form.build()).execute().returnContent().asString();

        System.out.println(initiateUploadResponse);

        return initiateUploadResponse;
    }

    private static String makeCompleteUploadRequest(JSONObject uploadResponse) throws  Exception{
        JSONArray filesJSON = uploadResponse.getJSONArray("files");
        JSONObject fileJSON = (JSONObject) filesJSON.get(0);

        String uploadToken = fileJSON.getString("uploadToken");
        String mimeType = fileJSON.getString("mimeType");

        String completeURI = AEM_CS_HOST + uploadResponse.getString("completeURI");
        File inputFile = new File(INPUT_FILE);

        Form form = Form.form();
        form.add(UPLOAD_TOKEN, uploadToken);
        form.add(FILE_NAME, inputFile.getName());
        form.add(MIME_TYPE, mimeType);

        String completeResponse = Request.Post(completeURI)
                .addHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                .addHeader("Authorization", "Bearer " + BEARER_TOKEN)
                .bodyForm(form.build()).execute().returnContent().asString();

        return completeResponse;
    }
}
