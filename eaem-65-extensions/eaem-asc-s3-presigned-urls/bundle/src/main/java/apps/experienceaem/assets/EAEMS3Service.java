package apps.experienceaem.assets;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ResponseHeaderOverrides;
import com.day.cq.commons.jcr.JcrConstants;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.commons.util.DamUtil;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.api.JackrabbitValue;
import org.apache.jackrabbit.api.ReferenceBinary;
import org.apache.sling.api.resource.Resource;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Property;
import javax.jcr.Value;
import java.net.URL;
import java.util.Date;

@Component(
        immediate=true ,
        service={ EAEMS3Service.class }
)
@Designate(ocd = EAEMS3Service.Configuration.class)
public class EAEMS3Service {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    private static AmazonS3 s3Client = AmazonS3ClientBuilder.defaultClient();

    private long singleFileS3Expiration = (1000 * 60 * 60);
    private String s3BucketName = "";

    @Activate
    protected void activate(EAEMS3Service.Configuration configuration) {
        singleFileS3Expiration = configuration.singleFileS3Expiration();
        s3BucketName = configuration.s3BucketName();
    }

    public String getS3PresignedUrl(Resource resource){
        String presignedUrl = "";

        if( (resource == null) || !DamUtil.isAsset(resource)){
            logger.warn("Resource null or not a dam:Asset");
            return presignedUrl;
        }

        if(StringUtils.isEmpty(s3BucketName)){
            logger.warn("S3 Bucket Name not configured");
            return presignedUrl;
        }

        Asset s3Asset = DamUtil.resolveToAsset(resource);

        if(s3Asset == null){
            return presignedUrl;
        }

        try{
            String objectKey = getS3AssetIdFromReference(resource);

            if(StringUtils.isEmpty(objectKey)){
                logger.debug("S3 object key empty, could be in segment store - " + resource.getPath());

                presignedUrl = resource.getPath();

                return presignedUrl;
            }

            logger.debug("Path = " + resource.getPath() + ", S3 object key = " + objectKey);

            if(StringUtils.isEmpty(objectKey)){
                return presignedUrl;
            }

            ResponseHeaderOverrides nameHeader = new ResponseHeaderOverrides();
            nameHeader.setContentType(s3Asset.getMimeType());
            nameHeader.setContentDisposition("attachment; filename=" + resource.getName());

            GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(s3BucketName, objectKey)
                    .withMethod(HttpMethod.GET)
                    .withResponseHeaders(nameHeader)
                    .withExpiration(getSingleFileS3ExpirationDate());

            URL url = s3Client.generatePresignedUrl(generatePresignedUrlRequest);

            presignedUrl = url.toString();

            logger.debug("Path = " + resource.getPath() + ", S3 presigned url = " + presignedUrl);
        }catch(Exception e){
            logger.error("Error generating s3 presigned url for " + resource.getPath(), e);
            presignedUrl = resource.getPath();
        }

        return presignedUrl;
    }

    public Date getSingleFileS3ExpirationDate(){
        Date expiration = new Date();

        long expTimeMillis = expiration.getTime();
        expTimeMillis = expTimeMillis + singleFileS3Expiration;

        expiration.setTime(expTimeMillis);

        return expiration;
    }

    public static String getS3AssetIdFromReference(final Resource assetResource) throws Exception {
        String s3AssetId = StringUtils.EMPTY;

        if( (assetResource == null) || !DamUtil.isAsset(assetResource)){
            return s3AssetId;
        }

        Resource original = assetResource.getChild(JcrConstants.JCR_CONTENT + "/renditions/original/jcr:content");

        if(original == null) {
            return s3AssetId;
        }

        Node orgNode = original.adaptTo(Node.class);

        if(!orgNode.hasProperty("jcr:data")){
            return s3AssetId;
        }

        Property prop = orgNode.getProperty("jcr:data");

        ReferenceBinary value = (ReferenceBinary)prop.getBinary();

        s3AssetId = value.getReference();

        if(StringUtils.isEmpty(s3AssetId) || !s3AssetId.contains(":")){
            return s3AssetId;
        }

        s3AssetId = s3AssetId.substring(0, s3AssetId.lastIndexOf(":"));

        s3AssetId = s3AssetId.substring(0, 4) + "-" + s3AssetId.substring(4);

        return s3AssetId;
    }

    public static String getS3AssetId(final Resource assetResource) {
        String s3AssetId = StringUtils.EMPTY;

        if( (assetResource == null) || !DamUtil.isAsset(assetResource)){
            return s3AssetId;
        }

        Resource original = assetResource.getChild(JcrConstants.JCR_CONTENT + "/renditions/original");

        if(original == null) {
            return s3AssetId;
        }

        //performance hit when the file size cross several MBs, GBs
        Value value = (Value)original.getValueMap().get(JcrConstants.JCR_CONTENT + "/" + JcrConstants.JCR_DATA, Value.class);

        if (value != null && (value instanceof JackrabbitValue)) {
            s3AssetId = gets3ObjectIdFromJackrabbitValue((JackrabbitValue) value);
        }

        return s3AssetId;
    }

    private static String gets3ObjectIdFromJackrabbitValue(JackrabbitValue jrValue) {
        if (jrValue == null) {
            return StringUtils.EMPTY;
        }

        String contentIdentity = jrValue.getContentIdentity();

        if (StringUtils.isBlank(contentIdentity)) {
            return StringUtils.EMPTY;
        }

        int end = contentIdentity.lastIndexOf('#');

        contentIdentity = contentIdentity.substring(0, end != -1 ? end : contentIdentity.length());

        return contentIdentity.substring(0, 4) + "-" + contentIdentity.substring(4);
    }

    @ObjectClassDefinition(
            name = "Experience AEM S3 for Download",
            description = "Experience AEM S3 Presigned URLs for Download"
    )
    public @interface Configuration {

        @AttributeDefinition(
                name = "Single file download S3 URL expiration",
                description = "Single file download Presigned S3 URL expiration",
                type = AttributeType.LONG
        )
        long singleFileS3Expiration() default (1000 * 60 * 60);

        @AttributeDefinition(
                name = "S3 Bucket Name e.g. eaem-s3-bucket",
                description = "S3 Bucket Name e.g. eaem-s3-bucket",
                type = AttributeType.STRING
        )
        String s3BucketName();
    }
}
