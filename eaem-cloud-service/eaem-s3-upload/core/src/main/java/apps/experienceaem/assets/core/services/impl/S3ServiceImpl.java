package apps.experienceaem.assets.core.services.impl;

import apps.experienceaem.assets.core.services.S3Service;
import com.amazonaws.HttpMethod;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import org.apache.commons.io.IOUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Date;

@Component(service = S3Service.class)
@Designate(ocd = S3ServiceImpl.S3Configuration.class)
public class S3ServiceImpl implements S3Service{
    private final Logger logger = LoggerFactory.getLogger(S3ServiceImpl.class);

    private String s3BucketName = "";
    private String s3AccessKey = "";
    private String s3SecretKey = "";
    private String s3Region = "";

    private URL getUploadPUTPresignedUrl(String fileName){
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                            .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials(s3AccessKey, s3SecretKey)))
                            .withRegion(s3Region).build();

        Date expiration = new Date();

        long expTimeMillis = expiration.getTime() + (24 * 1000 * 60 * 60);
        expiration.setTime(expTimeMillis);

        GeneratePresignedUrlRequest presignedPut = new GeneratePresignedUrlRequest(s3BucketName, fileName)
                                .withMethod(HttpMethod.PUT)
                                .withExpiration(expiration);

        return s3Client.generatePresignedUrl(presignedPut);
    }

    @Activate
    @Modified
    protected void activate(final S3Configuration config) {
        s3BucketName = config.s3BucketName();
        s3AccessKey = config.s3AccessKey();
        s3SecretKey = config.s3SecretKey();
        s3Region = config.s3Region();
    }

    public void uploadToS3(Resource csvResource){
        InputStream assetStream = null;
        FileOutputStream out = null;
        BufferedOutputStream awsOut = null;
        String tempFilePath = null;

        try {
            assetStream = (InputStream) csvResource.getChild("jcr:content/renditions/original/jcr:content").adaptTo(ValueMap.class).get("jcr:data");

            @SuppressWarnings({"findsecbugs:PATH_TRAVERSAL_OUT", "findsecbugs:PATH_TRAVERSAL_IN"})
            File tempFile = File.createTempFile(csvResource.getName(), ".temp");
            tempFilePath = tempFile.getPath();

            out = new FileOutputStream(tempFile);
            IOUtils.copy(assetStream, out);
        }catch(Exception e) {
            logger.error("Error uploading to S3 - " + e);
            throw new RuntimeException("Error uploading to S3", e);
        }finally {
            try {
                if(out != null) { out.close(); }
            } catch (IOException e) {
                logger.warn("Error closing streams", e);
            }
        }

        @SuppressWarnings({"findsecbugs:PATH_TRAVERSAL_OUT", "findsecbugs:PATH_TRAVERSAL_IN"})
        File tempFile = new File(tempFilePath);

        try (FileInputStream csvIS = new FileInputStream(tempFile)){
            HttpURLConnection connection = (HttpURLConnection) getUploadPUTPresignedUrl(csvResource.getName()).openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "text/csv");
            connection.setRequestMethod("PUT");

            awsOut = new BufferedOutputStream(connection.getOutputStream());

            IOUtils.copy(csvIS, awsOut);

            awsOut.close();

            int resCode = connection.getResponseCode();

            if(resCode != 200){
                throw new RuntimeException("Error uploading file to S3, received response " + resCode);
            }

            if(!tempFile.delete()){
                logger.warn("Error deleting temp file from local file system after uploading to S3 - " + tempFile.getPath());
            }
        }catch(Exception e){
            logger.error("Error uploading to S3 - " + e);
            throw new RuntimeException("Error uploading to S3", e);
        } finally {
            try {
                if(assetStream != null) { assetStream.close(); }
                if(awsOut != null) { awsOut.close(); }
            } catch (IOException e) {
                logger.warn("Error closing streams", e);
            }
        }
    }

    @ObjectClassDefinition(name = "Amazon S3 Configuration")
    public @interface S3Configuration {
        @AttributeDefinition(
            name = "S3 Bucket Name",
            description = "S3 Bucket Name for uploading files",
            type = AttributeType.STRING
        )
        String s3BucketName() default "experience-aem";

        @AttributeDefinition(
            name = "S3 Access Key",
            description = "S3 Access Key for S3 bucket access",
            type = AttributeType.STRING
        )
        String s3AccessKey() default "";

        @AttributeDefinition(
            name = "S3 Secret Key",
            description = "S3 Secret Key for S3 bucket access",
            type = AttributeType.STRING
        )
        String s3SecretKey() default "";

        @AttributeDefinition(
            name = "S3 Region",
            description = "S3 Region for S3 bucket access",
            type = AttributeType.STRING
        )
        String s3Region() default "us-east-2";
    }
}
