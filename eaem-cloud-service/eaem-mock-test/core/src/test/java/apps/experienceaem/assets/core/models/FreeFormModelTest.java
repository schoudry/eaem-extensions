package apps.experienceaem.assets.core.models;

import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.testing.mock.sling.ResourceResolverType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Objects;

@ExtendWith(AemContextExtension.class)
public class FreeFormModelTest {
    private static final String FF_CONTENT_PATH = "/content/eaem/free-form";
    private static final String JSON_FILE_PATH = "/com/eaem/assets/models/FreeFormModelTest.json";
    private static final String EXPECTED_CONTENT = "<p>Experience AEM</p>\r\n";

    private AemContext aemContext = new AemContext(ResourceResolverType.RESOURCERESOLVER_MOCK);
    private FreeFormModel ffModel;

    @BeforeEach
    void setUp() throws Exception {
        aemContext.addModelsForClasses(FreeFormModel.class);
        aemContext.load().json(JSON_FILE_PATH, "/content");
        Resource resource = aemContext.currentResource(FF_CONTENT_PATH);
        ffModel = Objects.requireNonNull(resource.adaptTo(FreeFormModel.class));
    }

    @Test
    void testGetContent() {
        assertEquals(EXPECTED_CONTENT, Objects.requireNonNull(ffModel).getContent());
    }
}
