<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Fill Dialog Fields Sample</b>

    <br><br>

<%
    try {
        if (currentNode.hasNode("painting")) {
%>
            <div>
                Title : <%=currentNode.getProperty("title").getString()%>,
                Creator: <%=currentNode.getProperty("creator").getString()%>
            </div>
            <BR>
            <div>
                <img src='<%=currentNode.getNode("painting").getPath()%>' width=300 height=300>
            </div>
<%
        }else if (currentNode.hasProperty("paintingRef")) {
%>
            <div>
                Title : <%=currentNode.getProperty("title").getString()%>,
                Creator: <%=currentNode.getProperty("creator").getString()%>
            </div>
            <BR>
            <div>
                <img src='<%=currentNode.getProperty("paintingRef").getString()%>' width=300 height=300>
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
