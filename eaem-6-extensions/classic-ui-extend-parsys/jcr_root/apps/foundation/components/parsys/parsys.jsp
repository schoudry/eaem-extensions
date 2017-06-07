<%@ page import="com.day.cq.wcm.foundation.Paragraph" %>
<%@include file="/libs/foundation/global.jsp"%>

<%@include file="/libs/foundation/components/parsys/parsys.jsp"%>

<%
    StringBuilder sb = new StringBuilder();

    for (Paragraph par: parSys.paragraphs()) {
        if(par.getType() == Paragraph.Type.NORMAL){
            sb.append(par.getCssClass() + "=" + par.getPath()).append(";");
        }
    }
%>

<div data-eaem-paths="<%=sb.toString()%>"></div>
