<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@ page import="org.apache.jackrabbit.util.Text" %>
<%@include file="/libs/granite/ui/global.jsp" %>

<%!
    String COLUMN_PATH = "/libs/wcm/core/content/common/pathbrowser/column.html";
    String NAV_MARKER = "eaemNavMarker";

    private String getParentPath(String path) {
        return path.substring(0, path.lastIndexOf("/"));
    }

    private JSONArray getPathsJson(String[] paths){
        JSONArray array = new JSONArray();

        for(String path: paths){
            array.put(path);
        }

        return array;
    }
%>

<%
    String rootPathsStr = slingRequest.getParameter("eaemRootPaths");
    String[] rootPaths = StringUtils.isEmpty(rootPathsStr) ? new String[0] : rootPathsStr.split(",");

    for(String path: rootPaths){
        String includePath = COLUMN_PATH + Text.escapePath(getParentPath(path));

%>
        <sling:include path="<%=includePath%>"  />
<%
    }
%>
<div id="<%=NAV_MARKER%>">
</div>

<script type="text/javascript">
    (function($){
        function removeAddnNavsGetColumn($navs){
            $navs.not(":first").remove(); //remove all additional navs
            return $navs.first().children(".coral-ColumnView-column-content").html("");//get the column of first nav
        }

        function addRoots(){
            var $marker = $("#<%=NAV_MARKER%>"),
                $navs = $marker.prevAll("nav"),
                paths = <%=getPathsJson(rootPaths)%>,
                rootPaths = [];

            //find the root paths
            $.each(paths, function(index, path){
                rootPaths.push($navs.find("[data-value='" + path + "']"));
            });

            removeAddnNavsGetColumn($navs).append(rootPaths);

            //remove the marker div
            $marker.remove();
        }

        addRoots();
    }(jQuery));
</script>



