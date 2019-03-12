package apps.experienceaem.assets;

import com.day.cq.polling.importer.ImportException;
import com.day.cq.polling.importer.Importer;
import org.apache.sling.api.resource.Resource;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
        immediate = true,
        service = { Importer.class },
        property = {
                Importer.SCHEME_PROPERTY + "=" + EAEMListVariablesReportImporter.SCHEME_VALUE
        }
)
@Designate(ocd = EAEMListVariablesReportImporter.Configuration.class)
public class EAEMListVariablesReportImporter implements Importer{
    private Logger log = LoggerFactory.getLogger(getClass());

    public static final String SCHEME_VALUE = "eaemReport";

    private static final long DEFAULT_REPORT_FETCH_DELAY = 10000;

    private long reportFetchDelay = DEFAULT_REPORT_FETCH_DELAY;

    @Activate
    protected void activate(Configuration configuration) {
        reportFetchDelay = configuration.reportFetchDelay();
    }

    public void importData(String scheme,String dataSource,Resource target) throws ImportException {
        log.debug("Importing analytics data");
    }

    public void importData(String scheme,String dataSource,Resource target,String login,String password)
            throws ImportException {
        importData(scheme, dataSource, target);
    }

    @ObjectClassDefinition(
            name = "EAEM Analytics Report Importer",
            description = "Imports Analytics List Variable Reports periodically into AEM"
    )
    public @interface Configuration {

        @AttributeDefinition(
                name = "Fetch delay",
                description = "Number in milliseconds between attempts to fetch a queued report. Default is set to 10000 (10s).",
                defaultValue = { "" + DEFAULT_REPORT_FETCH_DELAY },
                type = AttributeType.LONG
        )

        long reportFetchDelay() default DEFAULT_REPORT_FETCH_DELAY;
    }
}
