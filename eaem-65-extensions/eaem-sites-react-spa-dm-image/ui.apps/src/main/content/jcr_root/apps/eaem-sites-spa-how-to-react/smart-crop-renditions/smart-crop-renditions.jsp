<%@include file="/libs/granite/ui/global.jsp"%>

<%@page session="false"
        import="java.util.Iterator,
                  org.apache.sling.commons.json.JSONObject,
                  com.adobe.granite.ui.components.Config"%>

<%
    Config cfg = cmp.getConfig();
    ValueMap dynVM = null;

    JSONObject dynRenditions = new JSONObject();
    Resource dynResource = null;

    response.setContentType("application/json");

    for (Iterator<Resource> items = cmp.getItemDataSource().iterator(); items.hasNext();) {
        JSONObject dynRendition = new JSONObject();

        dynResource = items.next();

        dynVM = dynResource.getValueMap();

        String name = String.valueOf(dynVM.get("breakpoint-name"));

        dynRendition.put("type", "IMAGE");
        dynRendition.put("name", name);
        dynRendition.put("url", dynVM.get("copyurl"));

        dynRenditions.put(name, dynRendition);
    }

    dynRenditions.write(response.getWriter());
%>