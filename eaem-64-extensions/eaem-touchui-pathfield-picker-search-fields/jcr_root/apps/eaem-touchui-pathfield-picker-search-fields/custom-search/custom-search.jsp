<%@include file="/libs/granite/ui/global.jsp"%>

<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@ page import="java.util.Iterator" %>

<%
    for (Iterator<Resource> it = resource.listChildren(); it.hasNext();) {
%>

<div class="coral-Form-fieldwrapper eaem-touchui-pathfield-picker-search-field">

<sling:include resource="<%= it.next() %>" />

</div>

<%
    }
%>

