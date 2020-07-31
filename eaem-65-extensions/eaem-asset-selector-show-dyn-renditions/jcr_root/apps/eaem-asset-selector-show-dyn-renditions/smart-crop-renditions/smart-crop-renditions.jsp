<%@include file="/libs/granite/ui/global.jsp"%>

<%@page session="false"
        import="java.util.Iterator,
                  org.apache.sling.commons.json.JSONObject,
                  com.adobe.granite.ui.components.Config,
                  com.adobe.granite.ui.components.Tag"%>
<%@ page import="com.adobe.granite.ui.components.ds.ValueMapResource" %>

<%
    Config cfg = cmp.getConfig();
    ValueMap dynVM = null;
    JSONObject dynRenditions = new JSONObject();

    response.setContentType("application/json");

    for (Iterator<Resource> items = cmp.getItemDataSource().iterator(); items.hasNext();) {
        dynVM = ((ValueMapResource)items.next()).getValueMap();
        dynRenditions.put(String.valueOf(dynVM.get("breakpoint-name")), dynVM.get("copyurl"));
    }

    dynRenditions.write(response.getWriter());
%>