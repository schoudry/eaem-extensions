<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Fill Select Sample</b>

    <%
        ValueMap vm = resource.getValueMap();

        String language = vm.get("language", "");
        String[] country = vm.get("country", String[].class);

        if(country != null){
            out.print("<BR><BR>Selected: " + language + " = " + StringUtils.join(country, ","));
        }
    %>
</div>
