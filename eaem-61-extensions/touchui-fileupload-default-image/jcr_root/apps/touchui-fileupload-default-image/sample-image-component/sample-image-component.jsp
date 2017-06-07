<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Default Image Sample</b>

    <br><br>

<%
    try {
        if (currentNode.hasProperty("paintingRef")) {
%>
            <div>
                <img src='<%=currentNode.getProperty("paintingRef").getString()%>'>
            </div>
<%
        } else {
%>
            Add image in dialog
            <br><br>
<%
        }
    } catch (Exception e) {
        e.printStackTrace(new PrintWriter(out));
    }
%>

</div>
