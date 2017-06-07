package apps.experienceaem.msm;

import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.*;
import org.apache.felix.scr.annotations.Properties;
import org.apache.jackrabbit.api.JackrabbitSession;
import org.apache.jackrabbit.api.security.JackrabbitAccessControlEntry;
import org.apache.jackrabbit.api.security.JackrabbitAccessControlList;
import org.apache.jackrabbit.api.security.JackrabbitAccessControlPolicy;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONException;
import org.apache.sling.commons.json.JSONObject;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.jcr.security.*;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(metatype = false)
@Service
@Properties({
    @Property(name = "sling.servlet.paths", value = "/bin/experience-aem/msm/acl"),
    @Property(name = "sling.servlet.methods", value = { "GET", "POST" } )
})
public class AccessControl extends SlingAllMethodsServlet {

    private final static Logger log = LoggerFactory.getLogger(AccessControl.class);

    /**
     * Returns the ACL of path
     *
     * @param session
     * @param path
     * @return
     * @throws Exception
     */
    private JackrabbitAccessControlList getACL(Session session, String path) throws Exception{
        AccessControlManager acMgr = session.getAccessControlManager();

        JackrabbitAccessControlList acl = null;
        AccessControlPolicyIterator app = acMgr.getApplicablePolicies(path);

        while (app.hasNext()) {
            AccessControlPolicy pol = app.nextAccessControlPolicy();

            if (pol instanceof JackrabbitAccessControlPolicy) {
                acl = (JackrabbitAccessControlList) pol;
                break;
            }
        }

        if(acl == null){
            for (AccessControlPolicy pol : acMgr.getPolicies(path)) {
                if (pol instanceof JackrabbitAccessControlPolicy) {
                    acl = (JackrabbitAccessControlList) pol;
                    break;
                }
            }
        }

        return acl;
    }

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
                        throws ServletException, IOException {
        String liveCopies = request.getParameter("liveCopies");
        String path = request.getParameter("path");
        String principal = request.getParameter("principal");
        String type = request.getParameter("type");

        if(StringUtils.isEmpty(liveCopies) || StringUtils.isEmpty(path) || StringUtils.isEmpty(principal)){
            throw new RuntimeException("Required parameters missing");
        }

        if(StringUtils.isEmpty(type)){
            type = "ALLOW";
        }

        try{
            Session session = request.getResourceResolver().adaptTo(Session.class);
            AccessControlManager acMgr = session.getAccessControlManager();

            for(String copy: liveCopies.split(",")){
                String compPath = copy + path;
                JackrabbitAccessControlList acl = getACL(session, compPath);

                if(acl == null){
                    throw new RuntimeException("ACL not found for  path: " + compPath);
                }

                UserManager uMgr = ((JackrabbitSession) session).getUserManager();
                Authorizable authorizable = uMgr.getAuthorizable(principal);

                Privilege[] p = new Privilege[]{ acMgr.privilegeFromName(Privilege.JCR_WRITE) };
                acl.addEntry(authorizable.getPrincipal(), p, type.equalsIgnoreCase("ALLOW"));

                acMgr.setPolicy(compPath, acl);
            }

            session.save();

            JSONWriter jw = new JSONWriter(response.getWriter());
            jw.object().key("success").value("success").endObject();
        }catch(Exception e){
            log.error("Error adding acl in path - " + path + ", for - " + liveCopies, e);
            throw new ServletException(e);
        }
    }

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        String path = request.getParameter("path");
        String privilege = request.getParameter("privilege");

        try{
            Session session = request.getResourceResolver().adaptTo(Session.class);

            Privilege privileges[] = null; String pName = null;
            JSONObject map = null, allow = new JSONObject(), deny = new JSONObject();
            JSONArray arr = null;

            JackrabbitAccessControlList acl = getACL(session, path);
            AccessControlEntry entries[] = acl.getAccessControlEntries();

            for(AccessControlEntry entry : entries){
                privileges = entry.getPrivileges();

                map = ((JackrabbitAccessControlEntry)entry).isAllow() ? allow : deny;

                for(Privilege p : privileges){
                    pName = p.getName();

                    if(StringUtils.isNotEmpty(privilege) && !privilege.equals(pName)){
                        continue;
                    }

                    try{
                        arr = (JSONArray)map.get(pName);
                    }catch(JSONException je){
                        arr = new JSONArray();
                        map.put(pName, arr);
                    }

                    arr.put(entry.getPrincipal().getName());
                }
            }

            JSONWriter jw = new JSONWriter(response.getWriter());
            jw.object().key("allow").value(allow).key("deny").value(deny).endObject();
        }catch(Exception e){
            log.error("Error getting privileges for path - " + path, e);
            throw new ServletException(e);
        }
    }
}