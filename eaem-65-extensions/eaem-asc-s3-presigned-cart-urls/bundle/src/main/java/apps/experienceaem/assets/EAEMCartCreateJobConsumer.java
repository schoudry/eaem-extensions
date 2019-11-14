package apps.experienceaem.assets;

import com.day.cq.dam.api.Asset;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Component(
        immediate = true,
        service = {JobConsumer.class},
        property = {
                "process.label = Experience AEM Cart Create Job Topic",
                JobConsumer.PROPERTY_TOPICS + "=" + EAEMCartCreateJobConsumer.JOB_TOPIC
        }
)
public class EAEMCartCreateJobConsumer implements JobConsumer {
    private static final Logger log = LoggerFactory.getLogger(EAEMCartCreateJobConsumer.class);

    public static final String JOB_TOPIC = "apps/experienceaem/assets/cart";
    public static final String CART_NAME = "CART_NAME";
    public static final String ASSET_PATHS = "ASSET_PATHS";

    @Reference
    ResourceResolverFactory resourceResolverFactory;

    @Reference
    private EAEMS3Service eaems3Service;

    @Override
    public JobResult process(final Job job) {
        long startTime = System.currentTimeMillis();

        String cartName = (String)job.getProperty(CART_NAME);
        String assetPaths = (String)job.getProperty(ASSET_PATHS);

        log.debug("Processing cart - " + cartName);

        ResourceResolver resolver = null;

        try{
            resolver = resourceResolverFactory.getAdministrativeResourceResolver(null);

            List<Asset> assets = eaems3Service.getAssets(resolver, assetPaths);

            String cartTempFilePath = eaems3Service.createTempZip(assets, cartName);

            log.debug("Cart - " + cartName + ", creation took " + ((System.currentTimeMillis() - startTime) / 1000) + " secs");

            String objectKey = eaems3Service.uploadToS3(cartName, cartTempFilePath);

            String presignedUrl = eaems3Service.getS3PresignedUrl(objectKey, cartName, EAEMS3Service.ZIP_MIME_TYPE);

            log.debug("Cart - " + cartName + ", Presigned url - " + presignedUrl );

            log.debug("Cart - " + cartName + ", with object key - " + objectKey + ", creation and upload to S3 took " + ((System.currentTimeMillis() - startTime) / 1000) + " secs");

        }catch(Exception e){
            log.error("Error creating cart - " + cartName + ", with assets - " + assetPaths, e);
            return JobResult.FAILED;
        }finally{
            if(resolver != null){
                resolver.close();
            }
        }

        return JobResult.OK;
    }
}
