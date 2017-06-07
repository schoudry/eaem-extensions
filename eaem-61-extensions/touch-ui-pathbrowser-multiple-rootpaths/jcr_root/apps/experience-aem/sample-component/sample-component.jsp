<%@ page import="org.apache.sling.commons.json.JSONObject" %>
<%@ page import="java.io.PrintWriter" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">

<%
        try {
            Property property = null;

            if (currentNode.hasProperty("path")) {
                property = currentNode.getProperty("path");
            }

            if (property != null) {
%>
                Selected Path: <%= property.getString() %>
                <br><br>
<%
            } else {
%>
                Add path in dialog
                <br><br>
<%
            }
        } catch (Exception e) {
            e.printStackTrace(new PrintWriter(out));
        }
%>
</div>
