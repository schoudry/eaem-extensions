<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Multi Field Sample Dashboard</b>

    <br><br>

    <%
        try {
            String[] dashboards = { "pages" } ;

            for(String dash : dashboards){
                if (currentNode.hasNode(dash)) {
                    Node mapNode = currentNode.getNode(dash);
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
    Add values in dialog - <b><%= dash %></b>
    <br><br>
    <%
                }
            }
        } catch (Exception e) {
            e.printStackTrace(new PrintWriter(out));
        }
    %>

</div>
