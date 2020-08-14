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
        JSONObject dynRendition = new JSONObject();

        dynVM = ((ValueMapResource)items.next()).getValueMap();

        String name = String.valueOf(dynVM.get("breakpoint-name"));

        dynRendition.put("name", name);
        dynRendition.put("image", dynVM.get("copyurl"));
        dynRendition.put("url", dynVM.get("copyurl"));

        dynRenditions.put(name, dynRendition);
    }

    dynRenditions.write(response.getWriter());
%>