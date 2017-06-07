<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>RTE Required in Dialog Sample</b>

    <br><br>

    <%
        try {
            PropertyIterator itr = currentNode.getProperties();

            while(itr.hasNext()){
                Property property = itr.nextProperty();

                if(property.getName().startsWith("jcr:")){
                    continue;
                }

    %>
                <%=property.getName()%> : <b><%=property.getString()%></b>
    <%
        }
    %>
    <br><br>
    <%
        } catch (Exception e) {
            e.printStackTrace(new PrintWriter(out));
        }
    %>

</div>
