package apps.experienceaem.assets;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 *
 * This is the configuration class that takes properties for a scheduler to run
 *
 */
@ObjectClassDefinition(name = "Experience AEM: SlingSchedulerConfiguration", description = "Sling scheduler configuration")
public @interface SampleSchedulerConfiguration {

    /**
     * This method will return the name of the Scheduler
     *
     * @return {@link String}
     */
    @AttributeDefinition(
            name = "Scheduler name",
            description = "Name of the scheduler",
            type = AttributeType.STRING)
    public String schedulerName() default "Custom Sling Scheduler Configuration";

    /**
     * This method will check if the scheduler is concurrent or not
     *
     * @return {@link Boolean}
     */
    @AttributeDefinition(
            name = "Enabled",
            description = "True, if scheduler service is enabled",
            type = AttributeType.BOOLEAN)
    public boolean enabled() default false;

    /**
     * This method returns the Cron expression which will decide how the scheduler will run
     *
     * @return {@link String}
     */
    @AttributeDefinition(
            name = "Cron Expression",
            description = "Cron expression used by the scheduler",
            type = AttributeType.STRING)
    public String cronExpression() default "0/10 * * * * ?";

    /**
     * This method returns a custom parameter just to show case the functionality
     *
     * @return {@link String}
     */
    @AttributeDefinition(
            name = "Custom Path Parameter",
            description = "Custom path parameter to be used by the scheduler",
            type = AttributeType.STRING)
    public String customPathParameter() default "/content/dam";
}
