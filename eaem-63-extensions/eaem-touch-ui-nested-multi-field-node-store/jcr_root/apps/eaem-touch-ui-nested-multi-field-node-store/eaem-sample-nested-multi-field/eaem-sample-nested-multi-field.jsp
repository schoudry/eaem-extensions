<%@ page import="org.apache.sling.commons.json.JSONObject" %>
<%@ page import="java.io.PrintWriter" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@ page import="org.apache.commons.lang.StringUtils" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Countries and States</b>

    <br><br>

<%
        try {
            if (currentNode.hasNode("countries")) {
                Node countriesNode = currentNode.getNode("countries"), cNode;
                int counter = 1; PropertyIterator itr = null; Property property;

                while(true){
                    if(!countriesNode.hasNode(String.valueOf(counter))){
                        break;
                    }

                    cNode = countriesNode.getNode(String.valueOf(counter));

                    itr = cNode.getProperties();

                    while(itr.hasNext()){
                        property = itr.nextProperty();

                        if(property.getName().equals("jcr:primaryType")){
                            continue;
                        }
%>
                        <%=property.getName()%> : <b><%=property.getString()%></b>
<%
                    }

                    if(cNode.hasNode("states")){
                        Node statesNode = cNode.getNode("states"), sNode;
                        int sCounter = 1; PropertyIterator sTtr = null; Property sProperty;

                        while(true){
                            if(!statesNode.hasNode(String.valueOf(sCounter))){
                                break;
                            }

                            sNode = statesNode.getNode(String.valueOf(sCounter));

                            itr = sNode.getProperties();

                            while(itr.hasNext()){
                                sProperty = itr.nextProperty();

                                if(sProperty.getName().equals("jcr:primaryType")){
                                    continue;
                                }

                                String value = null;

                                if (sProperty.isMultiple()) {
                                    Value[] values = sProperty.getValues();
                                    value = StringUtils.join(values, ",");
                                } else {
                                    value = sProperty.getString();
                                }

%>
                                <div style="margin-left:30px">
                                        <%=sProperty.getName()%> : <b><%=value%></b>
                                </div>
<%
                            }

%>
                            <br>
<%

                            sCounter = sCounter + 1;
                        }
                }

                counter = counter + 1;
        }
    } else {
%>
    Add countries and states in dialog</b>
<br><br>
<%
            }
        } catch (Exception e) {
            e.printStackTrace(new PrintWriter(out));
        }
%>
</div>
