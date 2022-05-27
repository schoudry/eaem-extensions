package apps.eaem_anti_samy_sling_model.components.basic_render_component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;

public class ExperienceAEMModel {
    private static final Logger log = LoggerFactory.getLogger(ExperienceAEMModel.class);

    private String title;

    public String getTitle() {
        return title;
    }

    public String getHtml() {
        return "<span font='color:red'>test antisamy</span>";
    }
}
