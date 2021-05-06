<%@page session="false"
        import="org.apache.sling.api.resource.Resource,
                com.adobe.granite.ui.components.rendercondition.RenderCondition,
                com.adobe.granite.ui.components.rendercondition.SimpleRenderCondition" %>
<%@ page import="org.apache.jackrabbit.api.security.user.UserManager" %>
<%@ page import="org.apache.jackrabbit.api.security.user.Authorizable" %>
<%@ page import="org.apache.jackrabbit.api.security.user.Group" %>
<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.2" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0" %>

<sling:defineObjects/>
<cq:defineObjects/>

<%
    boolean allowed = false;

    try{
        String CONFIG_RES = "/conf/global/settings/dam/eaem-dam-config";
        Resource configRes = resourceResolver.getResource(CONFIG_RES);
        String assetProcessGroup = configRes.getValueMap().get("processAssetsGroup", String.class);

        if(StringUtils.isNotEmpty(assetProcessGroup)){
            UserManager userManager = resourceResolver.adaptTo(UserManager.class);

            Authorizable user = userManager.getAuthorizable(slingRequest.getUserPrincipal().getName());
            Group smartCropGroup = (Group)userManager.getAuthorizable(assetProcessGroup);

            allowed = ((smartCropGroup != null) && smartCropGroup.isMember(user));
        }
    }catch(Exception e){
        allowed = false;
    }

    request.setAttribute(RenderCondition.class.getName(), new SimpleRenderCondition(allowed));
%>