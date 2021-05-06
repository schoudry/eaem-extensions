<%@include file="/libs/granite/ui/global.jsp" %>

<%@page session="false"%>

<%
    String CONFIG_RES = "/conf/global/settings/dam/eaem-dam-config";

    request.setAttribute("granite.ui.form.contentpath", CONFIG_RES);
%>

<sling:include resourceType="<%= "/libs/granite/ui/components/coral/foundation/form/userpicker" %>"/>

