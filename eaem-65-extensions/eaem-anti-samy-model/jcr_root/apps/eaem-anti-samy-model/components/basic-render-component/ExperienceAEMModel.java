package apps.eaem_anti_samy_model.components.basic_render_component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;

public class ExperienceAEMModel {
    private static final Logger log = LoggerFactory.getLogger(ExperienceAEMModel.class);

    public String getHtml() {
        return "<tv3-tooltip id='demo-1' tip='The CREF Board of Trustees consists of 10 people who oversee the management of CREF.'>" +
                    "<span slot='source'>CREF Board of Trustees</span>" +
                    "<div>The CREF Board of Trustees consists of 10 people who oversee the management of CREF.</div>" +
                "</tv3-tooltip>";
    }
}
