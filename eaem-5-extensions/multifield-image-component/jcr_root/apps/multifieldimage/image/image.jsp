<%@include file="/libs/foundation/global.jsp"%>

<%@ page import="java.util.Iterator" %>

<br>

<%
    Iterator<Resource> children = resource.listChildren();
    Resource res = null;

    if(!children.hasNext()){
%>
    Configure Images

    <br>
<%
    }

    while(children.hasNext()){
        res = children.next();
%>
        Image <br><br>

        <img src="<%=res.adaptTo(Node.class).getProperty("imageReference").getString()%>">

        <br><br>
<%
    }
%>