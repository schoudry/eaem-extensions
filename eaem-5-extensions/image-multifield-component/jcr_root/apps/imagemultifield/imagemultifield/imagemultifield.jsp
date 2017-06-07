<%@include file="/libs/foundation/global.jsp"%>

<%@ page import="java.util.Iterator" %>
<%@ page import="com.day.cq.wcm.foundation.Image" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>

<%
    Iterator<Resource> children = resource.listChildren();

    if(!children.hasNext()){
%>
        <br><br>

        Configure Images

        <br><br>
<%
    }else{
        Resource imagesResource = children.next();
        ValueMap map = imagesResource.adaptTo(ValueMap.class);
        String order = map.get("order", String.class);

        Image img = null; String src = null;
        JSONArray array = new JSONArray(order);

        for(int i = 0; i < array.length(); i++){
            img = new Image(resource);
            img.setItemName(Image.PN_REFERENCE, "imageReference");
            img.setSuffix(String.valueOf(array.get(i)));
            img.setSelector("img");

            src = img.getSrc();
%>
            <img src='<%=src%>'/>
            <br><br>
<%
        }
    }
%>