<%@ page import="com.day.cq.dam.commons.util.UIHelper" %>
<%@include file="/libs/granite/ui/global.jsp"%>

<%
    Resource currentResource = UIHelper.getCurrentSuffixResource(slingRequest);
    String browserType = request.getHeader("User-Agent");
    String originalRend = currentResource.getPath() + "/jcr:content/renditions/original";

    if(currentResource.getPath().endsWith(".usdz")){
        if(!browserType.contains("Safari")){
%>
            <p style="text-align: center">Preview for USDZ files supported on Safari only</p>
<%
        }
%>
        <a href="<%= originalRend%>" rel="ar">
            <h2 style="text-align: center">Click to open in QuickLook</h2>
        </a>

<%
        return;
    }
%>

<sling:include path="<%= currentResource.getPath() %>" resourceType="/libs/dam/gui/components/admin/renditions" />
