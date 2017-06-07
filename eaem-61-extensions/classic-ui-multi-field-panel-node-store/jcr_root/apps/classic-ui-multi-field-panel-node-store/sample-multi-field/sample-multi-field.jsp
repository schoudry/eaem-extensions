<%@ page import="org.apache.sling.commons.json.JSONObject" %>
<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Multi Field Sample</b>

    <br><br>

<%
    try {
        if (currentNode.hasNode("stock")) {
            Node mapNode = currentNode.getNode("stock");
            int counter = 1; PropertyIterator itr = null; Property property;

            while(true){
                if(!mapNode.hasNode(String.valueOf(counter))){
                    break;
                }

                itr = mapNode.getNode(String.valueOf(counter)).getProperties();

                while(itr.hasNext()){
                    property = itr.nextProperty();

                    if(property.getName().equals("jcr:primaryType")){
                        continue;
                    }

                    %>
                        <%=property.getName()%> : <b><%=property.getString()%></b>
                    <%
                }

                counter = counter + 1;

                %>
                    <br><br>
                <%
            }
        } else {
%>
            Add values in dialog
            <br><br>
<%
        }
    } catch (Exception e) {
        e.printStackTrace(new PrintWriter(out));
    }
%>

</div>
