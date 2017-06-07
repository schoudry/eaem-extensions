<%@ page import="java.io.PrintWriter" %>
<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Limit Multi Field Sample</b>

    <br><br>

<%
    try {
        if (currentNode.hasProperty("headers")) {
            out.print(StringUtils.join((Object[])properties.get("headers"), ", "));
        }else{
            out.print("Add values in dialog");
        }
    } catch (Exception e) {
        e.printStackTrace(new PrintWriter(out));
    }
%>

</div>
