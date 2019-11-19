package apps.experienceaem.assets;

import com.day.cq.dam.api.Asset;
import com.day.cq.mailer.MessageGatewayService;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.day.cq.commons.mail.MailTemplate;
import com.day.cq.mailer.MessageGateway;
import org.apache.commons.lang.text.StrLookup;
import org.apache.commons.mail.Email;
import org.apache.commons.mail.HtmlEmail;

import javax.jcr.Session;
import javax.mail.internet.InternetAddress;
import java.util.*;

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
    public static final String CART_RECEIVER_EMAIL = "CART_RECEIVER_EMAIL";
    public static final String ASSET_PATHS = "ASSET_PATHS";
    private static String EMAIL_TEMPLATE_PATH = "/apps/eaem-asc-s3-presigned-cart-urls/mail-templates/cart-template.html";
    private static String SENDER_EMAIL = "experience.aem@gmail.com";

    @Reference
    private MessageGatewayService messageGatewayService;

    @Reference
    ResourceResolverFactory resourceResolverFactory;

    @Reference
    private EAEMS3Service eaems3Service;

    @Override
    public JobResult process(final Job job) {
        long startTime = System.currentTimeMillis();

        String cartName = (String)job.getProperty(CART_NAME);
        String assetPaths = (String)job.getProperty(ASSET_PATHS);
        String receiverEmail = (String)job.getProperty(CART_RECEIVER_EMAIL);

        log.debug("Processing cart - " + cartName);

        ResourceResolver resolver = null;

        try{
            resolver = resourceResolverFactory.getAdministrativeResourceResolver(null);

            List<Asset> assets = eaems3Service.getAssets(resolver, assetPaths);

            String cartTempFilePath = eaems3Service.createTempZip(assets, cartName);

            log.debug("Cart - " + cartName + ", creation took " + ((System.currentTimeMillis() - startTime) / 1000) + " secs");

            String objectKey = eaems3Service.uploadToS3(cartName, cartTempFilePath);

            String presignedUrl = eaems3Service.getS3PresignedUrl(objectKey, cartName, EAEMS3Service.ZIP_MIME_TYPE);

            log.debug("Cart - " + cartName + ", with object key - " + objectKey + ", creation and upload to S3 took " + ((System.currentTimeMillis() - startTime) / 1000) + " secs");

            List<String> assetNames = new ArrayList<String>();

            for(Asset asset : assets){
                assetNames.add(asset.getName());
            }

            log.debug("Sending email to - " + receiverEmail +  ", with assetNames in cart - " + cartName + " - " + StringUtils.join(assetNames, ","));

            Map<String, String> emailParams = new HashMap<String,String>();

            emailParams.put("subject", "Ready for download - " + cartName);
            emailParams.put("assetNames", StringUtils.join(assetNames, ","));
            emailParams.put("presignedUrl", presignedUrl);

            sendMail(resolver, emailParams, receiverEmail);
        }catch(Exception e){
            log.error("Error creating cart - " + cartName + ", with assets - " + assetPaths, e);
            return JobResult.FAILED;
        }finally{
            if(resolver != null){
                resolver.close();
            }
        }

        log.debug("Processing complete cart - " + cartName);

        return JobResult.OK;
    }

    private Email sendMail(ResourceResolver resolver, Map<String, String> emailParams, String recipientEmail) throws Exception{
        MailTemplate mailTemplate = MailTemplate.create(EMAIL_TEMPLATE_PATH, resolver.adaptTo(Session.class));

        if (mailTemplate == null) {
            throw new Exception("Template missing - " + EMAIL_TEMPLATE_PATH);
        }

        Email email = mailTemplate.getEmail(StrLookup.mapLookup(emailParams), HtmlEmail.class);

        email.setTo(Collections.singleton(new InternetAddress(recipientEmail)));
        email.setFrom(SENDER_EMAIL);

        MessageGateway<Email> messageGateway = messageGatewayService.getGateway(email.getClass());

        messageGateway.send(email);

        return email;
    }
}
