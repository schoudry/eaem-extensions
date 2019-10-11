<%@include file="/libs/granite/ui/global.jsp"%>
<%@ page import="org.apache.sling.api.resource.ValueMap" %>
<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0"%>

<%
    final String ASSET_RES_TYPE = "dam/gui/coral/components/admin/contentrenderer/row/asset";

    Resource assetResource = resource;
    String eaemTitle = "", eaemDesc = "", eaemKeywords = "";

    if(assetResource.getResourceType().equals(ASSET_RES_TYPE)){
        ValueMap vm = assetResource.getChild("jcr:content/metadata").getValueMap();

        eaemTitle = (String)vm.get("eaemTitle", "");
        eaemDesc = (String)vm.get("eaemDesc", "");
        eaemKeywords = (String)vm.get("eaemKeywords", "");
    }

%>

<td is="coral-table-cell" value="<%= eaemTitle %>">
    <%= eaemTitle %>
</td>

<td is="coral-table-cell" value="<%= eaemDesc %>">
    <%= eaemDesc %>
</td>

<td is="coral-table-cell" value="<%= eaemKeywords %>">
    <%= eaemKeywords %>
</td>

<cq:include script = "/libs/dam/gui/coral/components/admin/contentrenderer/row/common/reorder.jsp"/>
