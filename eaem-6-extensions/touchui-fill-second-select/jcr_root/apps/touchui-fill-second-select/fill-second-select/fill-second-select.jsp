<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Fill Select Sample</b>

    <%
        ValueMap vm = resource.getValueMap();

        String language = vm.get("language", "");
        String country = vm.get("country", "");

        if(!country.equals("")){
            out.print("<BR><BR>Selected: " + country + " = " + language);
        }
    %>
</div>
