<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Image Multi Field Sample</b>

    <br><br>

<%
    try {
        if (currentNode.hasNode("artists")) {
            Node mapNode = currentNode.getNode("artists"), cNode;
            int counter = 1; PropertyIterator itr = null; Property property;

            while(true){
                if(!mapNode.hasNode(String.valueOf(counter))){
                    break;
                }

                cNode = mapNode.getNode(String.valueOf(counter));

                itr = cNode.getProperties();

                while(itr.hasNext()){
                    property = itr.nextProperty();

                    if(property.getName().equals("jcr:primaryType")){
                        continue;
                    }

                    if(property.getName().equals("paintingRef")){
%>
                        <div>
                            <img src='<%=property.getString()%>' width='125' height='150'>
                        </div>
<%
                        continue;
                    }
%>
                    <%=property.getName()%> : <b><%=property.getString()%></b>
<%
                }

                if(cNode.hasNode("painting")){
%>
                    <div>
                        <img src='<%=cNode.getPath() + "/painting"%>' width='125' height='150'>
                    </div>
<%
                }

                counter = counter + 1;
%>
                <br><br>
<%
            }
        } else {
%>
                Add images in dialog</b>
                <br><br>
<%
            }
    } catch (Exception e) {
        e.printStackTrace(new PrintWriter(out));
    }
%>

</div>
