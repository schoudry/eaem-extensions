<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Select Listener Sample</b>

    <%
        ValueMap vm = resource.getValueMap();

        String country = vm.get("country", "");

        if(!country.equals("")){
            out.print("<BR><BR>Selected: " + country);
        }
    %>
</div>
