<%@include file="/libs/granite/ui/global.jsp"%>
<%@page session="false"%>

<%
    String eaemSelectedAssets = request.getParameter("eaemSelectedAssets");
    String eaemText = request.getParameter("eaemText");

    //PROCESS THE SELECTED ASSETS

    log.info("eaemText-------" + eaemText);
    log.info("eaemSelectedAssets-------" + eaemSelectedAssets);
%>