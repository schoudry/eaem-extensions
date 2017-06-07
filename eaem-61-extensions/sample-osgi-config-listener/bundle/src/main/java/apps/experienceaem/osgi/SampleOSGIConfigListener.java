package apps.experienceaem.osgi;

import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.Service;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationEvent;
import org.osgi.service.cm.ConfigurationListener;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Dictionary;

@Component
@Service
public class SampleOSGIConfigListener implements ConfigurationListener {
    public static final Logger log = LoggerFactory.getLogger(SampleOSGIConfigListener.class);

    public static final String LISTEN_PID = "com.day.cq.widget.impl.HtmlLibraryManagerImpl";

    @Reference
    org.osgi.service.cm.ConfigurationAdmin configAdmin;

    @Override
    public void configurationEvent(ConfigurationEvent event) {
        if(!LISTEN_PID.equals(event.getPid())) {
            return;
        }

        try{
            actOnUpdate();
        }catch(Exception e){
            log.error("Error SampleOSGIConfigListener", e);
        }
    }

    private void actOnUpdate() throws Exception{
        Configuration config = configAdmin.getConfiguration(LISTEN_PID);

        Dictionary props = config.getProperties();

        if(props == null){
            return;
        }

        log.info("HTML Library Manager htmllibmanager.minify - " + props.get("htmllibmanager.minify"));
    }

    protected void activate(ComponentContext context) throws Exception {
        actOnUpdate();
    }
}
