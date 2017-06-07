<%@ page import="org.apache.sling.commons.json.JSONObject" %>
<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Sample Touch UI Component</b>

    <br><br>

    <%
        try {
            Property property = null;

            if (currentNode.hasProperty("sample")) {
                property = currentNode.getProperty("sample");
            }

            if (property != null) {
    %>

                Text : <b><%= property.getString() %></b>

    <%
            }
        } catch (Exception e) {
            e.printStackTrace(new PrintWriter(out));
        }
    %>

</div>
