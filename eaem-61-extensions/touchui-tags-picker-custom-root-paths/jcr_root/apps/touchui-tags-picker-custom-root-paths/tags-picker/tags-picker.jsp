<%@ page import="com.adobe.granite.ui.components.Config" %>
<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@ page import="org.apache.commons.lang3.ArrayUtils" %>
<%@include file="/libs/granite/ui/global.jsp" %>

<sling:include resourceType="/libs/cq/gui/components/common/tagspicker" />

<%
    Config cfg = cmp.getConfig();
    String[] eaemTagsPaths = cfg.get("eaemTagsRootPaths", String[].class);

    //tags paths not set, continue with ootb functionality
    if(ArrayUtils.isEmpty(eaemTagsPaths)){
        return;
    }
%>

<script type="text/javascript">
    (function(){
        var EAEM_TAGS_PATHS = "eaemtagsrootpaths",
            BROWSER_COLUMN_PATH = "/apps/touchui-tags-picker-custom-root-paths/content/tag-column-wrapper.html";

        function changeTagsPickerSrc(){
            var $eaemTagsPicker = $("[data-" + EAEM_TAGS_PATHS + "]");

            if($eaemTagsPicker.length == 0){
                return;
            }

            var browserCP = BROWSER_COLUMN_PATH + '<%=StringUtils.join(eaemTagsPaths, ",")%>';

            $eaemTagsPicker.attr("data-picker-src", browserCP);
        }

        changeTagsPickerSrc();
    }());
</script>
