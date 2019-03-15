package apps.experienceaem.jndi;

import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.post.JSONResponse;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.Context;
import javax.naming.directory.*;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.Properties;

@SlingServlet(
        label = "Experience AEM - List LDAP Users",
        description = "Experience AEM - List LDAP Users Servlet.",
        paths = { "/bin/experienceaem/jndi/check-user-exists" },
        methods = { "GET", "POST" },
        extensions = { "json" }
)
public class ListLDAPUsers extends SlingAllMethodsServlet{
    private static final Logger log = LoggerFactory.getLogger(ListLDAPUsers.class);

    private static String ldapServer = "localhost:389";
    private static String rootDn = "cn=Manager,dc=experienceaem,dc=com";
    private static String rootPass = "secret";

    @Override
    protected final void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
                                ServletException, IOException {
        try {
            addJSONHeaders(response);

            JSONObject jsonObject = new JSONObject();

            Properties env = new Properties();
            env.put( Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory" );
            env.put( Context.PROVIDER_URL, "ldap://" + ldapServer);
            env.put(Context.SECURITY_AUTHENTICATION,"simple");
            env.put( Context.SECURITY_PRINCIPAL, rootDn );
            env.put( Context.SECURITY_CREDENTIALS, rootPass );

            String dn = request.getParameter("dn");

            DirContext ctx = new InitialDirContext(env);

            Object user = ctx.lookup(dn);

            if(user != null){
                jsonObject.put(dn, user);
            }

            ctx.close();

            jsonObject.write(response.getWriter());
        } catch (Exception e) {
            log.error("Could not formulate JSON response");
            response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected final void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws
                                ServletException, IOException {
        doGet(request, response);
    }

    public static void addJSONHeaders(SlingHttpServletResponse response){
        response.setContentType(JSONResponse.RESPONSE_CONTENT_TYPE);
        response.setHeader("Cache-Control", "nocache");
        response.setCharacterEncoding("utf-8");
    }
}