<%@ page import="com.adobe.granite.ui.components.Config" %>
<%@include file="/libs/granite/ui/global.jsp" %>

<%
    Config mCfg = cmp.getConfig();

    String COLOR_PICKER_WRAPPER_ID = "eaem-color-picker-wrapper-" + mCfg.get("name", String.class).substring(2);
%>

<div id="<%=COLOR_PICKER_WRAPPER_ID%>">
    <%--include ootb color picker--%>
    <sling:include resourceType="/libs/granite/ui/components/foundation/form/colorpicker"/>
</div>

<script>
    (function($){
        var wrapper = $("#<%=COLOR_PICKER_WRAPPER_ID%>"),
                colorPicker = wrapper.find("[data-init='colorpicker']");

        if(_.isEmpty(colorPicker)){
            console.log("EAEM - color picker wrapper not found");
            return;
        }

        //extend otb Colorpicker to workaround the pickerModes bug
        //in granite/ui/components/foundation/form/colorpicker/render.jsp
        //colorpickerJson.put("modes", pickerModes); should have been
        //colorpickerJson.put("pickerModes", pickerModes);
        var config = colorPicker.data("config");
        config.pickerModes = config.modes;

        delete config.modes;

        colorPicker.attr("data-config", config);
    }(jQuery));
</script>