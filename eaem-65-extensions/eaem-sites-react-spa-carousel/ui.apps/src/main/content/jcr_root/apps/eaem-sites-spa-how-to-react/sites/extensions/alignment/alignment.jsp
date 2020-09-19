<%@include file="/libs/granite/ui/global.jsp" %>

<%@page session="false"
        import="org.apache.commons.lang3.StringUtils,
                  com.adobe.granite.ui.components.AttrBuilder,
                  com.adobe.granite.ui.components.Config,
                  com.adobe.granite.ui.components.Field,
                  com.adobe.granite.ui.components.Tag" %>
<%@ page import="org.apache.sling.api.SlingHttpServletRequest" %>
<%
    Config cfg = cmp.getConfig();

    SlingHttpServletRequest thisRequest = slingRequest;
    Resource dialog = thisRequest.getResourceResolver().getResource(thisRequest.getRequestPathInfo().getSuffix());

    String name = cfg.get("name", String.class);

    ValueMap vm =  dialog.getValueMap();
    String value = vm.get(name, "Center");

    String fieldLabel = cfg.get("fieldLabel", String.class);
    String fieldDesc = cfg.get("fieldDescription", String.class);
%>

<div class="coral-Form-fieldwrapper">
    <label class="coral-Form-fieldlabel"><%=fieldLabel%></label>

    <div class="eaem-dialog-content-align">
        <input type="hidden" name="<%=name%>" value="<%=value%>"/>

        <div>Center</div>

        <coral-icon icon="chevronUp" size="M" data-content-align="Top"></coral-icon>
        <coral-tooltip target="_prev" variant="info" role="tooltip" style="display: none;" placement="top">Top</coral-tooltip>
        <coral-icon icon="chevronDown" size="M" data-content-align="Bottom"></coral-icon>
        <coral-tooltip target="_prev" variant="info" role="tooltip" style="display: none;" placement="top">Bottom</coral-tooltip>
        <coral-icon icon="chevronDoubleLeft" size="M" data-content-align="Extreme Left"></coral-icon>
        <coral-tooltip target="_prev" variant="info" role="tooltip" style="display: none;" placement="top">Extreme Left</coral-tooltip>
        <coral-icon icon="chevronLeft" size="M" data-content-align="Left"></coral-icon>
        <coral-tooltip target="_prev" variant="info" role="tooltip" style="display: none;" placement="top">Left</coral-tooltip>
        <coral-icon icon="chevronRight" size="M" data-content-align="Right"></coral-icon>
        <coral-tooltip target="_prev" variant="info" role="tooltip" style="display: none;" placement="top">Right</coral-tooltip>
        <coral-icon icon="chevronDoubleRight" size="M" data-content-align="Extreme Right"></coral-icon>
        <coral-tooltip target="_prev" variant="info" role="tooltip" style="display: none;" placement="top">Extreme Right</coral-tooltip>
        <coral-icon icon="chevronUpDown" size="M" data-content-align="Center"></coral-icon>
        <coral-tooltip target="_prev" variant="info" role="tooltip" style="display: none;" placement="top">Center</coral-tooltip>
    </div>
    <coral-icon class="coral-Form-fieldinfo" icon="infoCircle" size="S"></coral-icon>
    <coral-tooltip target="_prev" placement="left" variant="info" role="tooltip" style="display: none;">
        <coral-tooltip-content><%=fieldDesc%></coral-tooltip-content>
    </coral-tooltip>
</div>
