package apps.experienceaem;

import com.adobe.granite.crypto.CryptoSupport;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import java.io.IOException;

@Component(label = "Experience AEM Encryption Decryption Servlet")
@Service
@Properties({
        @Property(name = "sling.servlet.methods", value = { "GET" }, propertyPrivate = true),
        @Property(name = "sling.servlet.paths", value = {
                "/bin/experienceaem/encrypt",
                "/bin/experienceaem/decrypt"
        })
})
public class EncryptDecryptServlet extends SlingAllMethodsServlet {
    private static final Logger LOG = LoggerFactory.getLogger(EncryptDecryptServlet.class);

    @Reference
    protected CryptoSupport cryptoSupport;

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        String words = request.getParameter("words");
        String uri = request.getRequestURI();

        if(StringUtils.isEmpty(words)){
            throw new ServletException("Need words");
        }

        String[] wordsArr = words.split(",");

        try{
            JSONWriter jw = new JSONWriter(response.getWriter());

            jw.object();

            for(String word : wordsArr){
                jw.key(word).value(uri.endsWith("encrypt") ? cryptoSupport.protect(word)
                                                           : cryptoSupport.unprotect(word));
            }

            jw.endObject();
        }catch(Exception e){
            LOG.error("Error encrypting/decrypting", e);
        }
    }
}
