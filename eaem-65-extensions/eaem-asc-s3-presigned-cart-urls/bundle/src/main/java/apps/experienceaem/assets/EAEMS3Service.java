package apps.experienceaem.assets;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.*;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.commons.util.DamUtil;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Component(
        immediate=true ,
        service={ EAEMS3Service.class }
)
@Designate(ocd = EAEMS3Service.Configuration.class)
public class EAEMS3Service {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    public static String ZIP_MIME_TYPE = "application/zip";

    private static AmazonS3 s3Client = AmazonS3ClientBuilder.defaultClient();

    private long cartFileS3Expiration = (1000 * 60 * 60);
    private String s3BucketName = "";

    private long directDownloadLimit = 52428800L; // 50 MB

    @Activate
    protected void activate(Configuration configuration) {
        cartFileS3Expiration = configuration.cartFileS3Expiration();
        s3BucketName = configuration.s3BucketName();
        directDownloadLimit = configuration.directDownloadLimit();
    }

    public long getDirectDownloadLimit(){
        return directDownloadLimit;
    }

    public String getS3PresignedUrl(String objectKey, String cartName, String mimeType){
        String presignedUrl = "";

        try{
            if(StringUtils.isEmpty(objectKey)){
                return presignedUrl;
            }

            ResponseHeaderOverrides nameHeader = new ResponseHeaderOverrides();
            nameHeader.setContentType(mimeType);
            nameHeader.setContentDisposition("attachment; filename=" + cartName);

            GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(s3BucketName, objectKey)
                    .withMethod(HttpMethod.GET)
                    .withResponseHeaders(nameHeader)
                    .withExpiration(getCartFileExpirationDate());

            URL url = s3Client.generatePresignedUrl(generatePresignedUrlRequest);

            presignedUrl = url.toString();

            logger.debug("Cart = " + cartName + ", S3 presigned url = " + presignedUrl);
        }catch(Exception e){
            logger.error("Error generating s3 presigned url for " + cartName);
        }

        return presignedUrl;
    }

    public String uploadToS3(String cartName, String cartTempFilePath){
        PutObjectRequest putRequest = new PutObjectRequest(s3BucketName, cartName, new File(cartTempFilePath));
        String objectKey = null;

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(ZIP_MIME_TYPE);

        putRequest.setMetadata(metadata);

        PutObjectResult putResult = s3Client.putObject(putRequest);

        if(putResult != null){
            objectKey = putRequest.getKey();
        }

        return objectKey;
    }

    public String createTempZip(List<Asset> assets, String cartName) throws Exception{
        File cartFile = File.createTempFile(cartName, ".tmp");
        FileOutputStream cartFileStream = new FileOutputStream(cartFile);

        ZipOutputStream zipStream = new ZipOutputStream( cartFileStream );

        zipStream.setMethod(ZipOutputStream.DEFLATED);
        zipStream.setLevel(Deflater.NO_COMPRESSION);

        assets.forEach(asset -> {
            BufferedInputStream inStream = new BufferedInputStream(asset.getOriginal().getStream());

            try{
                zipStream.putNextEntry(new ZipEntry(asset.getName()));

                IOUtils.copyLarge(inStream, zipStream);

                zipStream.closeEntry();
            }catch(Exception e){
                logger.error("Error adding zip entry - " + asset.getPath(), e);
            }finally{
                IOUtils.closeQuietly(inStream);
            }
        });

        IOUtils.closeQuietly(zipStream);

        return cartFile.getAbsolutePath();
    }

    public String getDirectDownloadUrl(List<Asset> assets){
        StringBuilder directUrl = new StringBuilder();

        directUrl.append("/content/dam/.assetdownload.zip/assets.zip?flatStructure=true&licenseCheck=false&");

        for(Asset asset : assets){
            directUrl.append("path=").append(asset.getPath()).append("&");
        }

        return directUrl.toString();
    }

    public List<Asset> getAssets(ResourceResolver resolver, String paths){
        List<Asset> assets = new ArrayList<Asset>();
        Resource assetResource = null;

        for(String path : paths.split(",")){
            assetResource = resolver.getResource(path);

            if(assetResource == null){
                continue;
            }

            assets.add(assetResource.adaptTo(Asset.class));
        }

        return assets;
    }

    public long getSizeOfContents(List<Asset> assets) throws Exception{
        long size = 0L;
        Node node, metadataNode = null;

        for(Asset asset : assets){
            node = asset.adaptTo(Node.class);
            metadataNode = node.getNode("jcr:content/metadata");

            long bytes =  Long.valueOf(DamUtil.getValue(metadataNode, "dam:size", "0"));

            if (bytes == 0 && (asset.getOriginal() != null)) {
                bytes = asset.getOriginal().getSize();
            }

            size = size + bytes;
        }

        return size;
    }

    public String getCartZipFileName(String username){
        if(StringUtils.isEmpty(username)){
            username = "anonymous";
        }

        String cartName = "cart-" + username;

        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd-HH-mm-ss");

        cartName = cartName + "-" + format.format(new Date()) + ".zip";

        return cartName;
    }

    public Date getCartFileExpirationDate(){
        Date expiration = new Date();

        long expTimeMillis = expiration.getTime();
        expTimeMillis = expTimeMillis + cartFileS3Expiration;

        expiration.setTime(expTimeMillis);

        return expiration;
    }

    @ObjectClassDefinition(
            name = "Experience AEM S3 for Download",
            description = "Experience AEM S3 Presigned URLs for Downloading Asset Share Commons Carts"
    )
    public @interface Configuration {

        @AttributeDefinition(
                name = "Cart download S3 URL expiration",
                description = "Cart download Presigned S3 URL expiration",
                type = AttributeType.LONG
        )
        long cartFileS3Expiration() default (3 * 24 * 60 * 60 * 1000 );

        @AttributeDefinition(
                name = "Cart direct download limit",
                description = "Cart size limit for direct download from AEM...",
                type = AttributeType.LONG
        )
        long directDownloadLimit() default 52428800L; // 50MB

        @AttributeDefinition(
                name = "S3 Bucket Name e.g. eaem-s3-bucket",
                description = "S3 Bucket Name e.g. eaem-s3-bucket",
                type = AttributeType.STRING
        )
        String s3BucketName();
    }
}
