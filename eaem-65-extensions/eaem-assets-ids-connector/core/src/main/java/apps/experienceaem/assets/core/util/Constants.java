package apps.experienceaem.assets.core.util;

import java.util.Collections;
import java.util.Map;

public class Constants {
    public static final String INDESIGN_TEMPLATE_PATH = "indesignTemplatePath";

    public static final String EXPORT_STRUCTURE = "EXPORT_STRUCTURE";

    public static final String STRUCTURE_JSON = "strcutureJSON";

    public static final String JOB_PATH = "jobPath";

    public static final String CONTENT_JSON = "contentJson";

    public static final String INDESIGN_SERVER_TOPIC = "com/eaem/ids";

    public static final String INDESIGN_SERVICE_USER = "eaem-ids-service";

    public static final String INDESIGN_GEN_REPORTS_PATH = "/var/dam/eaem";

    public static final String JOB_STATUS_PROCESSING = "PROCESSING";

    public static final String JOB_STATUS_SUCCESS = "SUCCESS";

    public static final String CONTENT_TYPE_PDF = "application/pdf";

    public static final String PUBLISH_IDS_OBJ_KEY = "aem-publish-ids";

    public static final String COVER_PAGE = "COVER_PAGE";

    public static final Map<String, Object> INDESIGN_AUTH_INFO = Collections.singletonMap("sling.service.subservice", INDESIGN_SERVICE_USER);

    public static final String PARAM_PREVIEW = "preview";

    public static final String PARAM_PREFIX = "p";

    public static final String PARAM_PATH = ".path";

    public static final String PARAM_TYPE = ".type";

    public static final String PARAM_VALUE = ".value";

    public static final String RAW_TEXT = "RAW_TEXT";

    public static final String CF_PATH = "CF_PATH";

    public static final String JCR_PATH = "JCR_PATH";

    public static final String MASTER_VARIATION = "master";

    public static final String P_TAG = "<p>";

    public static final String P_END_TAG = "</p>";

    public static final String PREVIEW_RENDITION = "/jcr:content/renditions/cq5dam.thumbnail.319.319.png";
}
