package apps.experienceaem.assets;

import com.day.cq.analytics.sitecatalyst.SitecatalystUtil;
import com.day.cq.analytics.sitecatalyst.SitecatalystWebservice;
import com.day.cq.polling.importer.ImportException;
import com.day.cq.polling.importer.Importer;
import com.day.cq.wcm.webservicesupport.Configuration;
import com.day.cq.wcm.webservicesupport.ConfigurationManager;
import com.day.cq.wcm.webservicesupport.ConfigurationManagerFactory;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.*;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONObject;
import org.apache.sling.settings.SlingSettingsService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.GregorianCalendar;

@Component(
        immediate = true,
        service = {Importer.class},
        property = {
                Importer.SCHEME_PROPERTY + "=" + PDFViewsImporter.SCHEME_VALUE
        }
)
@Designate(ocd = PDFViewsImporter.PDFViewsImporterConfiguration.class)
public class PDFViewsImporter implements Importer {
    private Logger log = LoggerFactory.getLogger(getClass());

    public static final String SCHEME_VALUE = "eaemReport";
    private static final String USE_ANALYTICS_FRAMEWORK = "use-analytics-framework";
    private static final String GET_ANALYTICS_FOR_LAST_DAYS = "get-analytics-for-last-days";
    private static final String UPDATE_ANALYTICS_SERVICE = "eaem-update-pdf-with-analytics";
    private static final long DEFAULT_REPORT_FETCH_DELAY = 10000;
    private static final long DEFAULT_REPORT_FETCH_ATTEMPTS = 10;
    private long reportFetchDelay = DEFAULT_REPORT_FETCH_DELAY;
    private long reportFetchAttempts = DEFAULT_REPORT_FETCH_ATTEMPTS;

    @Reference
    private SitecatalystWebservice sitecatalystWebservice;

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Reference
    private ConfigurationManagerFactory cfgManagerFactory;

    @Reference
    private SlingSettingsService settingsService;

    @Activate
    protected void activate(PDFViewsImporterConfiguration configuration) {
        reportFetchDelay = configuration.reportFetchDelay();
        reportFetchAttempts = configuration.reportFetchAttempts();
    }

    public void importData(String scheme, String dataSource, Resource target) throws ImportException {
        log.info("Importing analytics data for evar - " + dataSource);

        try {
            String useAnalyticsFrameworkPath = target.getValueMap().get(USE_ANALYTICS_FRAMEWORK, String.class);

            if(StringUtils.isEmpty(useAnalyticsFrameworkPath)){
                log.warn("Analytics framework path property " + USE_ANALYTICS_FRAMEWORK + " missing on " + target.getPath());
                return;
            }

            Configuration configuration = getConfiguration(useAnalyticsFrameworkPath, target.getResourceResolver());

            String reportSuiteID = SitecatalystUtil.getReportSuites(settingsService, configuration);

            log.debug("Report Suite ID - " + reportSuiteID);

            JSONObject reportDescription = getReportDescription(target, dataSource, reportSuiteID);

            String queueReportResponse = sitecatalystWebservice.queueReport(configuration, reportDescription);

            log.debug("queueReportResponse - " + queueReportResponse);

            JSONObject jsonObj = new JSONObject(queueReportResponse);

            Long queuedReportId = jsonObj.optLong("reportID");

            if(queuedReportId == 0L) {
                log.error("Could not queue report, queueReportResponse - " + queueReportResponse);
                return;
            }

            boolean reportReady = false;
            JSONObject report = null;

            for(int attemptNo = 1; attemptNo <= reportFetchAttempts; ++attemptNo) {
                log.debug("Attempt number " + attemptNo + " to fetch queued report " + queuedReportId);

                String reportData = sitecatalystWebservice.getReport(configuration, queuedReportId.toString());

                log.debug("Get report " + queuedReportId + " result: " + reportData);

                jsonObj = new JSONObject(reportData);
                String errorResponse = jsonObj.optString("error");

                reportReady = ((errorResponse == null) || !"report_not_ready".equalsIgnoreCase(errorResponse));

                if(reportReady) {
                    report = jsonObj.optJSONObject("report");
                    break;
                }

                Thread.sleep(reportFetchDelay);
            }

            if(report == null) {
                log.error("Could not fetch queued report [" + queuedReportId + "] after " + reportFetchAttempts + " attempts");
            }

            ResourceResolver rResolverForUpdate = resolverFactory.getServiceResourceResolver(
                    Collections.singletonMap("sling.service.subservice", (Object)UPDATE_ANALYTICS_SERVICE));

            saveAnalyticsData(report, rResolverForUpdate);

            log.info("Successfully imported analytics data with report id - " + queuedReportId);
        }catch(Exception e){
            log.error("Error importing analytics data for list var - " + dataSource, e);
        }
    }

    private void saveAnalyticsData(JSONObject report, ResourceResolver resolver ) throws Exception{
        JSONArray data = report.optJSONArray("data");
        JSONObject metrics = null;
        String pdfPath;

        Resource pdfResource;
        Node pdfJcrContent;
        ModifiableValueMap modifiableValueMap = null;

        for(int d = 0, len = data.length(); d < len; d++){
            metrics = data.getJSONObject(d);
            pdfPath = metrics.getString("name");

            pdfResource = resolver.getResource(pdfPath);

            if(pdfResource == null){
                log.warn("PDF Asset not found - " + pdfPath);
                continue;
            }

            Resource performanceRes = ResourceUtil.getOrCreateResource(pdfResource.getResourceResolver(),
                                pdfPath + "/" + "jcr:content" + "/" + "performance", (String)null, (String)null, false);

            modifiableValueMap = performanceRes.adaptTo(ModifiableValueMap.class);

            modifiableValueMap.put("dam:impressionCount", metrics.getJSONArray("counts").getString(0));
            modifiableValueMap.put("jcr:lastModified", Calendar.getInstance());
        }

        resolver.adaptTo(Session.class).save();
    }

    private JSONObject getReportDescription(Resource target, String dataSource, String reportSuiteID) throws Exception{
        Calendar cal = new GregorianCalendar();
        cal.setTime(new Date());

        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");

        Integer daysCount = target.getValueMap().get(GET_ANALYTICS_FOR_LAST_DAYS, Integer.class);

        if(daysCount == null){
            daysCount = -365;
        }

        JSONObject reportDescription = new JSONObject();

        reportDescription.put("elements", getElements(dataSource));
        reportDescription.put("metrics", getMetrics());
        reportDescription.put("reportSuiteID", reportSuiteID);
        reportDescription.put("dateTo", formatter.format(cal.getTime()));

        cal.add(Calendar.DAY_OF_MONTH, daysCount);
        reportDescription.put("dateFrom", formatter.format(cal.getTime()));

        return reportDescription;
    }

    private JSONArray getElements(String dataSource) throws Exception{
        JSONObject elements = new JSONObject();

        elements.put("id", dataSource);
        elements.put("top", 10000);
        elements.put("startingWith", 1);

        return new JSONArray().put(elements);
    }

    private JSONArray getMetrics() throws Exception{
        JSONObject metrics = new JSONObject();

        metrics.put("id", "pageviews");

        return new JSONArray().put(metrics);
    }

    private Configuration getConfiguration(String analyticsFrameworkPath, ResourceResolver resourceResolver)
            throws Exception {
        ConfigurationManager cfgManager = cfgManagerFactory.getConfigurationManager(resourceResolver);

        String[] services = new String[]{ analyticsFrameworkPath };

        return cfgManager.getConfiguration("sitecatalyst", services);
    }


    public void importData(String scheme,String dataSource,Resource target,String login,String password)
            throws ImportException {
        importData(scheme, dataSource, target);
    }

    @ObjectClassDefinition(
            name = "EAEM Analytics Report Importer",
            description = "Imports Analytics List Variable Reports periodically into AEM"
    )
    public @interface PDFViewsImporterConfiguration {
        @AttributeDefinition(
                name = "Fetch delay",
                description = "Number in milliseconds between attempts to fetch a queued report. Default is set to 10000 (10s)",
                defaultValue = {"" + DEFAULT_REPORT_FETCH_DELAY},
                type = AttributeType.LONG
        ) long reportFetchDelay() default DEFAULT_REPORT_FETCH_DELAY;

        @AttributeDefinition(
                name = "Fetch attempts",
                description = "Number of attempts to fetch a queued report. Default is set to 10",
                defaultValue = {"" + DEFAULT_REPORT_FETCH_ATTEMPTS},
                type = AttributeType.LONG
        ) long reportFetchAttempts() default DEFAULT_REPORT_FETCH_ATTEMPTS;
    }
}

