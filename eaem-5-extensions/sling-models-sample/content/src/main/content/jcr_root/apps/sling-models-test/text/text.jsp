<%@page session="false"%>
<%@ page import="com.sreek.test.TestModel" %>
<%@include file="/libs/foundation/global.jsp"%>

<cq:defineObjects/>

<%
    TestModel model = resource.adaptTo(TestModel.class);
    pageContext.setAttribute("model", model);

%>

Mode in page context attribute: ${model.text}

