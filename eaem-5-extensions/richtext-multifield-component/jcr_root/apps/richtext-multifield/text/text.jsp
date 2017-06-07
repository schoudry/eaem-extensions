<%@ page import="org.apache.commons.lang3.ArrayUtils" %>
<%@include file="/libs/foundation/global.jsp" %>

<%
    String[] texts = properties.get("text", String[].class);

    if(ArrayUtils.isEmpty(texts)){
%>
        <br><br>
        Configure Texts
        <br><br>
<%
    }else{
        for(String text : texts){
%>
            <%= text %>
            <br><br>
<%
        }
    }

%>
