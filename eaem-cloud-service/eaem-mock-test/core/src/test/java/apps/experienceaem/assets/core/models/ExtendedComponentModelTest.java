package apps.experienceaem.assets.core.models;

import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.components.Component;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import junitx.util.PrivateAccessor;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.testing.mock.sling.ResourceResolverType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.assertEquals;


import java.util.Objects;

import static org.mockito.Mockito.lenient;

@ExtendWith({ AemContextExtension.class, MockitoExtension.class })
public class ExtendedComponentModelTest {
    private final AemContext ctx = new AemContext(ResourceResolverType.RESOURCERESOLVER_MOCK);

    private static final String JSON_FILE_PATH = "/com/eaem/assets/models/ExtendedComponentModel.json";
    public static final String TEXT_COMPONENT = "/content/evlive/electric-life/jcr:content/root/container/textComponent";
    public static final String JCR_CONTENT_RES_PATH = "/content/evlive/electric-life/jcr:content/root/container/textComponent";

    @Mock
    private Component component;

    ExtendedComponentModel ecModel;

    @BeforeEach
    void before() {
        ctx.load().json(JSON_FILE_PATH, "/content/evlive");
        Page elPage = ctx.currentPage("/content/evlive/electric-life");
        ecModel = Objects.requireNonNull(elPage.adaptTo(ExtendedComponentModel.class));
    }

    @Test
    void testGetComponentPath() throws NoSuchFieldException{
        lenient().when(component.getPath()).thenReturn(JCR_CONTENT_RES_PATH);

        PrivateAccessor.setField(ecModel, "component", component);

        assertEquals(TEXT_COMPONENT, ecModel.getComponentPath());
    }
}
