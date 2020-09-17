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
    ValueMap vm = slingRequest.getResource().getValueMap();

    String name = cfg.get("name", String.class);
    String sliderValue = dialog.getValueMap().get(name, "50");

    Tag tag = cmp.consumeTag();

    AttrBuilder attrs = tag.getAttrs();
    cmp.populateCommonAttrs(attrs);

    attrs.add("name", name);
    attrs.add("value", sliderValue);
    attrs.add("min", cfg.get("min", Double.class));
    attrs.add("max", cfg.get("max", Double.class));
    attrs.add("step", cfg.get("step", String.class));

    String fieldLabel = cfg.get("fieldLabel", String.class);
    String fieldDesc = cfg.get("fieldDescription", String.class);
%>

<div class="coral-Form-fieldwrapper">
    <label class="coral-Form-fieldlabel"><%=fieldLabel%></label>
    <coral-slider style="width:100%; margin: 0" <%= attrs.build() %>></coral-slider>
    <coral-icon class="coral-Form-fieldinfo" icon="infoCircle" size="S"></coral-icon>
    <coral-tooltip target="_prev" placement="left" class="coral3-Tooltip" variant="info" role="tooltip" style="display: none;">
        <coral-tooltip-content><%=fieldDesc%></coral-tooltip-content>
    </coral-tooltip>
</div>
<div class="eaem-dialog-slider">
    <span><%=sliderValue%>%</span>
</div>