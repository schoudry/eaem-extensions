<%@ page import="com.adobe.granite.ui.components.Value" %>
<%@include file="/libs/granite/ui/global.jsp" %>

<%
    String THUMBNAILS_PATH = "/conf/global/settings/dam/eaem-thumbnails";

    slingRequest.setAttribute(Value.CONTENTPATH_ATTRIBUTE, THUMBNAILS_PATH);
%>

<sling:include resourceType="/libs/granite/ui/components/coral/foundation/form/multifield"  />

