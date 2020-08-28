package apps.experienceaem.assets;


import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.servlet.ServletException;

import com.day.cq.commons.jcr.JcrConstants;
import com.day.cq.mailer.MessageGatewayService;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.jcr.base.util.AccessControlUtil;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.framework.Constants;

import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.day.cq.commons.mail.MailTemplate;
import com.day.cq.mailer.MessageGateway;
import org.apache.commons.lang.text.StrLookup;
import org.apache.commons.mail.Email;
import org.apache.commons.mail.HtmlEmail;

import javax.jcr.Session;
import javax.mail.internet.InternetAddress;
import java.util.*;

import java.io.IOException;

@Component(
        name = "Experience AEM Send Mail Servlet",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=POST",
                "sling.servlet.paths=/bin/experience-aem/send-mail"
        }
)
public class SendMailServlet extends SlingAllMethodsServlet {
    private final Logger logger = LoggerFactory.getLogger(getClass());

    private static String EMAIL_TEMPLATE_PATH = "/apps/eaem-assets-send-mail/mail-templates/send-assets.html";

    @Reference
    private MessageGatewayService messageGatewayService;

    @Override
    protected void doPost(final SlingHttpServletRequest req,
                         final SlingHttpServletResponse resp) throws ServletException, IOException {
        ResourceResolver resourceResolver = req.getResourceResolver();

        try{
            String to = req.getParameter("./to");
            String subject = req.getParameter("./subject");
            String body = req.getParameter("./body");

            Map<String, String> emailParams = new HashMap<String,String>();

            emailParams.put("subject", subject);
            emailParams.put("body", body.replaceAll("\r\n", "<BR>"));

            sendMail(resourceResolver, emailParams, to);
        }catch(Exception e){
            logger.error("Error sending email", e);
        }
    }

    private Email sendMail(ResourceResolver resolver, Map<String, String> emailParams, String recipientEmail) throws Exception{
        MailTemplate mailTemplate = MailTemplate.create(EMAIL_TEMPLATE_PATH, resolver.adaptTo(Session.class));

        if (mailTemplate == null) {
            throw new Exception("Template missing - " + EMAIL_TEMPLATE_PATH);
        }

        Email email = mailTemplate.getEmail(StrLookup.mapLookup(emailParams), HtmlEmail.class);

        email.setTo(Collections.singleton(new InternetAddress(recipientEmail)));

        MessageGateway<Email> messageGateway = messageGatewayService.getGateway(email.getClass());

        messageGateway.send(email);

        return email;
    }
}