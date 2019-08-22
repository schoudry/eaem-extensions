package apps.experienceaem.assets;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@ObjectClassDefinition(
        name = "Experience AEM: SlingSchedulerConfiguration",
        description = "Sling scheduler configuration"
)
public @interface SampleSchedulerConfiguration {

    @AttributeDefinition(
            name = "Scheduler name",
            description = "Name of the scheduler",
            type = AttributeType.STRING)
    public String schedulerName() default "Custom Sling Scheduler Configuration";

    @AttributeDefinition(
            name = "Enabled",
            description = "True, if scheduler service is enabled",
            type = AttributeType.BOOLEAN)
    public boolean enabled() default false;

    @AttributeDefinition(
            name = "Cron Expression",
            description = "Cron expression used by the scheduler",
            type = AttributeType.STRING)
    public String cronExpression() default "0/10 * * * * ?"; // runs every 10 seconds

    @AttributeDefinition(
            name = "Custom Path Parameter",
            description = "Custom path parameter to be used by the scheduler",
            type = AttributeType.STRING)
    public String customPathParameter() default "/content/dam";
}
