<%@ page import="org.apache.sling.commons.json.JSONObject" %>
<%@ page import="java.io.PrintWriter" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Countries and States</b>

    <br><br>

<%
        try {
            Property property = null;

            if (currentNode.hasProperty("countries")) {
                property = currentNode.getProperty("countries");
            }

            if (property != null) {
                JSONObject country = null, state = null;
                Value[] values = null;

                if (property.isMultiple()) {
                    values = property.getValues();
                } else {
                    values = new Value[1];
                    values[0] = property.getValue();
                }

                for (Value val : values) {
                    country = new JSONObject(val.getString());
%>
                    Country : <b><%= country.get("country") %></b>
<%
                    if (country.has("states")) {
                        JSONArray states = (JSONArray) country.get("states");

                        if (states != null) {
                            for (int index = 0, length = states.length(); index < length; index++) {
                                state = (JSONObject) states.get(index);
%>
                                <div style="padding-left: 25px">
                                    <a href="<%= state.get("path") %>.html" target="_blank">
                                        <%= state.get("state") %> - <%= state.get("path") %>
                                    </a>
                                </div>
<%
                            }
                        }

                    }
%>
                    <br><br>
<%
                }
            } else {
%>
                Add values in dialog
                <br><br>
<%
            }
        } catch (Exception e) {
            e.printStackTrace(new PrintWriter(out));
        }
%>
</div>
