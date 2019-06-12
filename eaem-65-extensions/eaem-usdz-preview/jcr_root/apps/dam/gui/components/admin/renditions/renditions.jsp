<%@ page import="com.day.cq.dam.commons.util.UIHelper" %>
<%@include file="/libs/granite/ui/global.jsp"%>

<%
    Resource currentResource = UIHelper.getCurrentSuffixResource(slingRequest);
    String browserType = request.getHeader("User-Agent");

    if(currentResource.getPath().endsWith(".usdz")){
        if(browserType.contains("Windows")){
%>
            <p style="text-align: center">Preview for USDZ files supported on iOS Safari only</p>
<%
            return;
        }
%>
        <a href="<%= currentResource.getPath()%>" rel="ar">
            <img class="image-model" src="/content/dam/we-retail/en/activities/climbing/climber-gear-outdoor.jpg">
        </a>

<%
        return;
    }
%>

<sling:include path="<%= currentResource.getPath() %>" resourceType="/libs/dam/gui/components/admin/renditions" />
