<%@include file="/libs/granite/ui/global.jsp"%>
<%@ page import="org.apache.sling.api.resource.ValueMap" %>
<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@ page import="com.day.cq.tagging.TagManager" %>
<%@ page import="com.day.cq.tagging.Tag" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Arrays" %>
<%@ page import="com.day.cq.dam.api.Asset" %>
<%@ page import="org.apache.commons.collections.CollectionUtils" %>
<%@ page import="org.apache.commons.lang3.ArrayUtils" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0"%>

<%
    final String ASSET_RES_TYPE = "dam/gui/coral/components/admin/contentrenderer/row/asset";

    Resource assetResource = resource;
    TagManager tagManager = assetResource.getResourceResolver().adaptTo(TagManager.class);
    String eaemTags = "";

    if(assetResource.getResourceType().equals(ASSET_RES_TYPE)){
        Object[] tags = (Object[])assetResource.adaptTo(Asset.class).getMetadata("cq:tags");

        if(!ArrayUtils.isEmpty(tags)){
            List<String> tagWords = new ArrayList<String>(tags.length);

            Arrays.stream(tags).forEach(tag -> tagWords.add(tagManager.resolve(tag.toString()).getTitle()));

            eaemTags = String.join(", ", tagWords);;
        }
    }
%>

<td is="coral-table-cell" value="<%= eaemTags %>">
    <%= eaemTags %>
</td>

<cq:include script = "/libs/dam/gui/coral/components/admin/contentrenderer/row/common/reorder.jsp"/>
