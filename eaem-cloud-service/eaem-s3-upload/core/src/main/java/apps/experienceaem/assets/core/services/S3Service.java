package apps.experienceaem.assets.core.services;

import org.apache.sling.api.resource.Resource;

public interface S3Service {

    public void uploadToS3(Resource pdfResource) throws Exception;

}
