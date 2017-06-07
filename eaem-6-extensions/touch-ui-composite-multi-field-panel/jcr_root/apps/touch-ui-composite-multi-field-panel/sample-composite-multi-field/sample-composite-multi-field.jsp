<%@ page import="org.apache.sling.commons.json.JSONObject" %>
<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Multi Field Sample Dashboard</b>

    <br><br>

<%
    try {
        String[] dashboards = { "iItems", "uItems" } ;

        for(String dash : dashboards){
            Property property = null;

            if (currentNode.hasProperty(dash)) {
                property = currentNode.getProperty(dash);
            }

            if (property != null) {
                JSONObject obj = null;
                Value[] values = null;

                if (property.isMultiple()) {
                    values = property.getValues();
                } else {
                    values = new Value[1];
                    values[0] = property.getValue();
                }

                for (Value val : values) {
                    obj = new JSONObject(val.getString());
%>
                    Page : <b><%= obj.get("page") %></b>,
                    URL : <b><a href="<%= obj.get("path") %>.html" target="_blank"><%= obj.get("path") %></a></b>

                    <br><br>
<%
                    }
                } else {
%>
                    Add values in dialog
                    <br><br>
<%
                }
        }
    } catch (Exception e) {
        e.printStackTrace(new PrintWriter(out));
    }
%>

</div>
