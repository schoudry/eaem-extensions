package apps.experienceaem.assets;

import org.apache.sling.commons.scheduler.ScheduleOptions;
import org.apache.sling.commons.scheduler.Scheduler;
import org.osgi.service.component.annotations.*;
import org.osgi.service.metatype.annotations.Designate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(immediate = true, service = Runnable.class)
@Designate(ocd = SampleSchedulerConfiguration.class)
public class SampleScheduler implements Runnable {
    private static final Logger LOGGER = LoggerFactory.getLogger(SampleScheduler.class);

    private String customPathParameter;
    private int schedulerId;

    @Reference
    private Scheduler scheduler;

    @Activate
    protected void activate(SampleSchedulerConfiguration config) {
        schedulerId = config.schedulerName().hashCode();
        customPathParameter = config.customPathParameter();

        addScheduler(config);
    }

    @Deactivate
    protected void deactivate(SampleSchedulerConfiguration config) {
        removeScheduler();
    }

    @Modified
    protected void modified(SampleSchedulerConfiguration config) {
        removeScheduler();

        schedulerId = config.schedulerName().hashCode();

        addScheduler(config);
    }


    private void removeScheduler() {
        scheduler.unschedule(String.valueOf(schedulerId));
    }

    /**
     * This method adds the scheduler
     *
     * @param config
     */
    private void addScheduler(SampleSchedulerConfiguration config) {
        if(config.enabled()) {
            ScheduleOptions scheduleOptions = scheduler.EXPR(config.cronExpression());
            scheduleOptions.name(config.schedulerName());
            scheduleOptions.canRunConcurrently(false);

            scheduler.schedule(this, scheduleOptions);
            LOGGER.info("Experience AEM Scheduler added");
        } else {
            LOGGER.info("Experience AEM Scheduler disabled");
        }
    }

    public void run() {
        LOGGER.info("Experience AEM, customPathParameter {}", customPathParameter);
    }
}