package apps.experienceaem.projects;

import com.adobe.cq.projects.api.Project;
import com.adobe.cq.projects.api.ProjectMember;
import com.day.cq.commons.mail.MailTemplate;
import com.day.cq.mailer.MessageGateway;
import com.day.cq.mailer.MessageGatewayService;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.text.StrLookup;
import org.apache.commons.mail.Email;
import org.apache.commons.mail.HtmlEmail;
import org.apache.commons.mail.SimpleEmail;
import org.apache.felix.scr.annotations.*;
import org.apache.felix.scr.annotations.Properties;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.Group;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.jcr.base.util.AccessControlUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.mail.internet.InternetAddress;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.*;

@Component(metatype = false, label = "Experience AEM Project Create Email Servlet", description = "")
@Service
@Properties({
    @Property(name = "sling.servlet.methods", value = {"GET"}, propertyPrivate = true),
    @Property(name = "sling.servlet.paths", value = "/bin/experience-aem/send-project-create-email", propertyPrivate = true),
    @Property(name = "sling.servlet.extensions", value = "json", propertyPrivate = true)
})
public class SendProjectCreateEmail extends SlingAllMethodsServlet {

    private static final Logger log = LoggerFactory.getLogger(SendProjectCreateEmail.class);

    @Reference
    private ResourceResolverFactory rrFactory;

    @Reference
    private MessageGatewayService messageGatewayService;

    private static String TEMPLATE_PATH = "/apps/touchui-create-project-send-email/mail/template.html";
    private static String SENDER_EMAIL = "experience.aem@gmail.com";
    private static String SENDER_NAME = "Experience AEM";
    private static String SENDER_EMAIL_ADDRESS = "senderEmailAddress";

    public String sendMail(ResourceResolver resolver, Resource projectRes, String recipientEmail,
                         String recipientName){
        if(StringUtils.isEmpty(recipientEmail)){
            throw new RuntimeException("Empty email");
        }

        if(StringUtils.isEmpty(recipientName)){
            recipientName = recipientEmail;
        }

        try{
            Project project = projectRes.adaptTo(Project.class);
            Map<String, String> emailParams = new HashMap<String,String>();

            emailParams.put(SENDER_EMAIL_ADDRESS, SENDER_EMAIL);
            emailParams.put("senderName", SENDER_NAME);
            emailParams.put("projectName", project.getTitle());
            emailParams.put("recipientName", recipientName);
            emailParams.put("body","Project Created - <a href='http://localhost:4502/projects/details.html"
                                            + projectRes.getPath() + "'>" + project.getTitle() + "</a>");
            emailParams.put("projectCreator", projectRes.adaptTo(ValueMap.class).get("jcr:createdBy", ""));

            send(resolver, emailParams, recipientEmail);
        }catch(Exception e){
            log.error("Error sending email to " + recipientEmail, e);
            recipientEmail = "";
        }

        return recipientEmail;
    }

    public Map<String, String> getMemberEmails(ResourceResolver resolver, Project project) throws Exception{
        Map<String, String> members = new LinkedHashMap<String, String>();
        String name = null, email = null;

        UserManager um = AccessControlUtil.getUserManager(resolver.adaptTo(Session.class));
        ValueMap profile = null; Iterator<Authorizable> itr = null;
        List<Authorizable> users = new ArrayList<Authorizable>();

        for(ProjectMember member : project.getMembers()) {
            Authorizable user = um.getAuthorizable(member.getId());

            if(user instanceof Group){
                itr = ((Group)user).getMembers();

                while(itr.hasNext()) {
                    users.add(itr.next());
                }
            }else{
                users.add(user);
            }
        }

        for(Authorizable user : users){
            profile = resolver.getResource(user.getPath() + "/profile").adaptTo(ValueMap.class);

            email = profile.get("email", "");

            if(StringUtils.isEmpty(email)){
                continue;
            }

            name = profile.get("familyName", "") + " " + profile.get("givenName", "");

            if(StringUtils.isEmpty(name.trim())){
                name = user.getID();
            }

            members.put(name, email);
        }

        return members;
    }

    private Email send(ResourceResolver resolver, Map<String, String> emailParams,
                       String recipientEmail) throws Exception{

        MailTemplate mailTemplate = MailTemplate.create(TEMPLATE_PATH, resolver.adaptTo(Session.class));

        if (mailTemplate == null) {
            throw new Exception("Template missing - " + TEMPLATE_PATH);
        }

        Email email = mailTemplate.getEmail(StrLookup.mapLookup(emailParams), HtmlEmail.class);

        email.setTo(Collections.singleton(new InternetAddress(recipientEmail)));
        email.setFrom(SENDER_EMAIL);

        MessageGateway<Email> messageGateway = messageGatewayService.getGateway(email.getClass());

        messageGateway.send(email);

        return email;
    }

    public void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
                            throws ServletException, IOException{
        ResourceResolver resolver = request.getResourceResolver();

        String projectPath = request.getParameter("projectPath");

        try{
            if(StringUtils.isEmpty(projectPath)){
                throw new RuntimeException("Empty projectPath");
            }

            Resource res = resolver.getResource(projectPath);

            if(res == null){
                throw new Exception("Project not found - " + projectPath);
            }

            Project project = res.adaptTo(Project.class);

            Map<String, String> members = getMemberEmails(resolver, project);
            String recipientEmail = null;
            JSONArray output = new JSONArray();

            for(Map.Entry<String, String> member : members.entrySet()){
                recipientEmail = sendMail(resolver, res, member.getValue(), member.getKey());

                if(StringUtils.isEmpty(recipientEmail)){
                    continue;
                }

                output.put(recipientEmail);
            }

            response.getWriter().print("{ success : " + output.toString() + " }");
        }catch(Exception e){
            log.error("Error sending email for project create - " + projectPath, e);
            response.getWriter().print("{ error : 'error sending email' }");
        }
    }
}