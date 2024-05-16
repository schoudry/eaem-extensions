<%@include file="/libs/granite/ui/global.jsp"%>

<%@page session="false"
        import="java.util.Iterator,
                org.apache.sling.commons.json.JSONObject,
                com.adobe.granite.ui.components.Tag"%>
<%@ page import="com.adobe.granite.ui.components.ds.DataSource" %>
<%@ page import="org.apache.sling.api.SlingHttpServletRequest" %>
<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@ page import="org.apache.sling.api.resource.ValueMap" %>
<%@ page import="com.adobe.granite.ui.components.ds.SimpleDataSource" %>
<%@ page import="org.apache.sling.api.resource.ResourceMetadata" %>

<%
    response.setContentType("application/json");

    Resource datasource = resource.getChild("datasource");
    DataSource refsDS = cmp.asDataSource(datasource);

    JSONObject cfReferences = new JSONObject();
    ValueMap refResVM = null;

    if(refsDS == null){
        cfReferences.write(response.getWriter());
        return;
    }

    ResourceMetadata refResourceMeta = null;

    for (Iterator<Resource> items = refsDS.iterator(); items.hasNext();) {
        refResourceMeta = items.next().getResourceMetadata();
        cfReferences.put(String.valueOf(refResourceMeta.get("path")), refResourceMeta.get("title"));
    }

    cfReferences.write(response.getWriter());
%>
