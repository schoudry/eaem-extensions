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

<%
    response.setContentType("application/json");

    SlingHttpServletRequest eaemSlingRequest = slingRequest;

    Resource datasource = resource.getChild("datasource");

    DataSource refsDS = cmp.asDataSource(datasource);

    response.getWriter().println( "-----" + refsDS);

    JSONObject cfReferences = new JSONObject();
    ValueMap refResVM = null;

    if(refsDS == null){
        cfReferences.write(response.getWriter());
        return;
    }

    Resource refResource = null;

    for (Iterator<Resource> items = refsDS.iterator(); items.hasNext();) {
        refResource = items.next();

        refResVM = refResource.getValueMap();

        response.getWriter().println(refResVM + "-----" + refResource);

        cfReferences.put(refResource.getPath(), refResource.getPath());
    }

    cfReferences.write(response.getWriter());
%>
