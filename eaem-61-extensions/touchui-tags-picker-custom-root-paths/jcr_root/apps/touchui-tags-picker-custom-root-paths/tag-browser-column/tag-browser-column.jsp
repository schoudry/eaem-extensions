<%@ page import="org.apache.sling.api.request.RequestPathInfo" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@include file="/libs/granite/ui/global.jsp" %>

<%!
    String TAG_BROWSER_COLUMN_PATH = "/libs/wcm/core/content/common/tagbrowser/tagbrowsercolumn.html";
    String TAG_NAV_MARKER = "eaemTagNavMarker";

    private String getParentTagPath(String tagPath) {
        return tagPath.substring(0, tagPath.lastIndexOf("/"));
    }

    private JSONArray getTagPathsJson(String[] tagPaths){
        JSONArray array = new JSONArray();

        for(String tagPath: tagPaths){
            array.put(tagPath);
        }

        return array;
    }
%>

<%
    RequestPathInfo pathInfo = slingRequest.getRequestPathInfo();
    String tagPaths[] = pathInfo.getSuffix().split(",");

    for(String tagPath: tagPaths){
        String includePath = TAG_BROWSER_COLUMN_PATH + getParentTagPath(tagPath);

%>
        <sling:include path="<%=includePath%>"  />
<%
    }
%>
<div id="<%=TAG_NAV_MARKER%>">
</div>

<script type="text/javascript">
    (function(){
        function removeAddnNavsGetColumn($navs){
            $navs.not(":first").remove(); //remove all additional navs
            return $navs.first().children(".coral-ColumnView-column-content").html("");//get the column of first nav
        }

        function addRootTags(){
            var $tagMarker = $("#<%=TAG_NAV_MARKER%>"),
                $navs = $tagMarker.prevAll("nav"),
                tagPaths = <%=getTagPathsJson(tagPaths)%>,
                rootTags = [];

            //find the root tags
            $.each(tagPaths, function(index, tagPath){
                rootTags.push($navs.find("[data-value='" + tagPath + "']"));
            });

            removeAddnNavsGetColumn($navs).append(rootTags);

            //remove the tag marker div
            $tagMarker.remove();
        }

        addRootTags();
    }());
</script>



