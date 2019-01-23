<%@include file="/libs/granite/ui/global.jsp"%>

<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@ page import="java.util.Iterator" %>

<div id="eaem-touchui-pathfield-picker-search-fields">
    <%
        for (Iterator<Resource> it = resource.listChildren(); it.hasNext();) {
    %>

    <sling:include resource="<%= it.next() %>" />

    <%
        }
    %>
</div>

