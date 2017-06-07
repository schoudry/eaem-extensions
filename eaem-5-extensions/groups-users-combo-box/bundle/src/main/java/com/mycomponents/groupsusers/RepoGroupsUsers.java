package com.mycomponents.groupsusers;

import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.jackrabbit.api.security.user.*;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.apache.sling.jcr.base.util.AccessControlUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.Iterator;

@SlingServlet(
        paths="/bin/mycomponents/groupsusers",
        methods = "GET",
        metatype = true,
        label = "Groups and Users Servlet"
)
public class RepoGroupsUsers extends SlingAllMethodsServlet {
    private static final long serialVersionUID = 1L;

    private static final Logger LOG = LoggerFactory.getLogger(RepoGroupsUsers.class);

    @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html");
        response.setCharacterEncoding("utf-8");

        try{
            ResourceResolver resolver = request.getResourceResolver();
            Session session = resolver.adaptTo(Session.class);

            UserManager um = AccessControlUtil.getUserManager(session);
            JSONWriter jw = new JSONWriter(response.getWriter());

            Group group = null;
            User user = null; Object obj = null;String id = null;

            Iterator<Authorizable> users, groups = um.findAuthorizables(new Query() {
                public  void build(QueryBuilder builder) {
                    builder.setSelector(Group.class);
                }
            });

            jw.object();
            jw.key("data").array();

            while(groups.hasNext()){
                group = (Group)groups.next();

                jw.object();
                jw.key("id").value(group.getID());
                jw.key("text").value(group.getPrincipal().getName());
                jw.key("group").value("y");
                jw.endObject();

                users = group.getMembers();

                while(users.hasNext()){
                    obj = users.next();

                    if(!(obj instanceof User)){
                        continue;
                    }

                    user = (User)obj;
                    id = user.getID();

                    if(id.contains("@")){
                        id = id.substring(0, id.indexOf("@"));
                    }

                    jw.object();
                    jw.key("id").value(id);
                    jw.key("text").value(user.getPrincipal().getName());
                    jw.endObject();
                }
            }

            jw.endArray();
            jw.endObject();
        }catch(Exception e){
            LOG.error("Error getting groups and users",e);
            throw new ServletException(e);
        }
    }
}
