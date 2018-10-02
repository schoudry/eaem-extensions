<%@page session="false"%>

<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.0"%>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0" %>

<cq:defineObjects />

<%@include file="/libs/dam/gui/coral/components/admin/contentrenderer/base/base.jsp"%>

<%
    Resource currentResource = UIHelper.getCurrentSuffixResource(slingRequest);
	Asset asset = currentResource.adaptTo(Asset.class);
%>

<sling:include path="<%= asset.getPath() %>" resourceType="dam/gui/components/admin/assetview/zoomviewer" />