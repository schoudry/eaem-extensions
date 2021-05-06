<%@include file="/libs/granite/ui/global.jsp" %>

<%@page session="false"
%>
<%@ page import="com.adobe.granite.ui.components.*" %>
<%@ page import="org.apache.sling.api.wrappers.ValueMapDecorator" %>
<%@ page import="java.util.HashMap" %>
<%
    Config cfg = cmp.getConfig();

    String CONFIG_RES = "/conf/global/settings/dam/eaem-dam-config";
    Resource configRes = resourceResolver.getResource(CONFIG_RES);

    String name = cfg.get("name", String.class);
    String value = "";

    if(configRes != null){
        value = configRes.getValueMap().get(name, String.class);
    }

    if(value != null){
        ValueMap vm = (ValueMap) request.getAttribute("com.adobe.granite.ui.components.Field");
        vm.put("value", value);
    }
%>

<sling:include path="<%= "/apps/granite/ui/components/coral/foundation/form/userpicker" %>"/>

