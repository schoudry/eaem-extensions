package apps.experienceaem.pm;

import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.jackrabbit.api.JackrabbitSession;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.Calendar;
import java.util.Date;

@Component(metatype = false)
@Service
@Properties({
        @Property(name = "sling.servlet.paths", value = "/bin/experience-aem/pm/expiry"),
        @Property(name = "sling.servlet.methods", value = { "GET", "POST" } )
})
public class GetPasswordOptions extends SlingAllMethodsServlet {

    private final static Logger log = LoggerFactory.getLogger(GetPasswordOptions.class);

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        try{
            ResourceResolver resolver = request.getResourceResolver();
            JackrabbitSession session = (JackrabbitSession)resolver.adaptTo(Session.class);
            Authorizable user = session.getUserManager().getAuthorizable(session.getUserID());

            ValueMap profileMap = resolver.getResource(user.getPath() + "/profile").adaptTo(ValueMap.class);

            JSONWriter jw = new JSONWriter(response.getWriter());
            jw.object();

            if(!profileMap.containsKey("passwordExpiryInDays")){
                jw.key("expired").value(false);
            }else{
                int passwordExpiryInDays = profileMap.get("passwordExpiryInDays", Integer.class);

                ValueMap resMap = resolver.getResource(user.getPath()).adaptTo(ValueMap.class);
                Date lastChangedDate = resMap.containsKey("passwordLastChanged") ? resMap.get("passwordLastChanged", Date.class)
                                                        : resMap.get("jcr:created", Date.class);

                jw.key("passwordLastChanged").value(lastChangedDate);

                //calculate the expiry date based on server time
                Calendar expiryDate = Calendar.getInstance();
                expiryDate.setTime(lastChangedDate);
                expiryDate.add(Calendar.DAY_OF_YEAR, passwordExpiryInDays);

                Calendar today = Calendar.getInstance();
                jw.key("expired").value(expiryDate.getTimeInMillis() < today.getTimeInMillis());
                jw.key("userPath").value(user.getPath());
                jw.key("passwordExpiryInDays").value(passwordExpiryInDays);
            }

            jw.endObject();
        }catch(Exception e){
            log.error("Error", e);
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        try{
            ResourceResolver resolver = request.getResourceResolver();
            JackrabbitSession session = (JackrabbitSession)resolver.adaptTo(Session.class);

            Authorizable user = session.getUserManager().getAuthorizable(session.getUserID());
            Node node = resolver.getResource(user.getPath()).adaptTo(Node.class);

            //set the last changed date to time on server
            node.setProperty("passwordLastChanged", Calendar.getInstance());
            session.save();

            JSONWriter jw = new JSONWriter(response.getWriter());
            jw.object().key("success").value("success").endObject();
        }catch(Exception e){
            log.error("Error", e);
            throw new ServletException(e);
        }
    }
}
