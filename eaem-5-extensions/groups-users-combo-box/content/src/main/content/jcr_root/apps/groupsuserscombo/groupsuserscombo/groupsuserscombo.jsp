<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<br><br>

Selected User : <%= ( properties.get("user") == null ) ? "None selected" : properties.get("user") %>

<br><br>
