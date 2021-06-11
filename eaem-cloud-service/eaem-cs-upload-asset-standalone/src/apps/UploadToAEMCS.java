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
    public static String BEARER_TOKEN = "eyJhbGciOiJSUzI1NiIsIng1dSI6Imltc19uYTEta2V5LTEuY2VyIn0.eyJpZCI6IjE2MjM0NDM3MzY3ODRfM2ZmZTU1ZmItYzlmOC00MzhjLWFjYjYtMGYxNGRjOTIzNjY1X3VlMSIsInR5cGUiOiJhY2Nlc3NfdG9rZW4iLCJjbGllbnRfaWQiOiJkZXYtY29uc29sZS1wcm9kIiwidXNlcl9pZCI6IjA3OEMzRTkwNTI0QzlBNUUwQTQ5MEQ0NUBBZG9iZUlEIiwic3RhdGUiOiIyS2ZWY1FUcVVGQ0RvRXlxdmpoQTVvZDciLCJhcyI6Imltcy1uYTEiLCJhYV9pZCI6IjA3OEMzRTkwNTI0QzlBNUUwQTQ5MEQ0NUBBZG9iZUlEIiwiZmciOiJWUU41R0RHTVhMSDdOWFVLQzRaTFRYUUFUST09PT09PSIsInNpZCI6IjE2MjMwODA0ODE1MTBfNGRlOTJjOTYtN2MyMi00NWZlLTgzNjMtMjhkNzk0ODM3MzhjX3VlMSIsInJ0aWQiOiIxNjIzNDQzNzM2Nzg0X2E3ZmI2MWY0LWE3NTYtNDRiMy1hZWQ3LTE2Y2ZkNWRhN2YwZV91ZTEiLCJtb2kiOiI4NmEyMjJjNCIsInJ0ZWEiOiIxNjI0NjUzMzM2Nzg0Iiwib2MiOiJyZW5nYSpuYTFyKjE3OWZjYzk4NjhhKkFZTUJZNVNLQjE2RjMwNkpDODlCRDlGNTNXIiwiZXhwaXJlc19pbiI6Ijg2NDAwMDAwIiwiY3JlYXRlZF9hdCI6IjE2MjM0NDM3MzY3ODQiLCJzY29wZSI6IkFkb2JlSUQsb3BlbmlkLHJlYWRfb3JnYW5pemF0aW9ucyxhZGRpdGlvbmFsX2luZm8ucHJvamVjdGVkUHJvZHVjdENvbnRleHQifQ.lqtjIFwpPSVBugfbCMolt_SS9j3x_m-oPmRs0k6tCMUVZPbgQAzhgyenX1vHoEqUFbUhIu1JU3pFLA3IAu0kWID1y3OEZDU452BELVNf-SDd10yUD4bh3U5OPJpmFshw0IahVxTP3DERGsXV2dMTSgM3Nycqe-QWPielzSkki8V3PUQE0QJWRs-iC8TOKqqeidQRWFXvMinXuKWQFEp8az6NZskGLLwa8Wwa8wjAV27_hpIMia_oJUtrZWT2HHJrfLvg1glWNfTokp8kVEjmCTwHbQbf7CqJsb9pqA28PBGPSWth_u-oEF0RdL5AuNtDIxquHA4DVTi4i__P2pIgiw";

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
